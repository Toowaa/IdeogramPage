import { NextResponse } from "next/server"
import { google, drive_v3 } from "googleapis"
import { GoogleAuth } from "google-auth-library"

// Configuración de Google Drive
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

// Interfaces para el cache y datos
interface ImageData {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  createdTime: string
  mimeType: string
  size: string
}

interface FolderResult {
  images: ImageData[]
  nextPageToken: string | null
  totalCount: number
  cached?: boolean
  stale?: boolean
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const cache = new Map<string, CacheEntry<FolderResult | ImageData>>()
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

// Helper para manejar cache
function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }
  
  return entry.data
}

function setCachedData<T extends FolderResult | ImageData>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  } as CacheEntry<FolderResult | ImageData>)
}

// Cliente autenticado con caching
let authClientCache: GoogleAuth | null = null
let authClientExpiry: number = 0

function getAuthenticatedClient(): GoogleAuth {
  try {
    // Reutilizar cliente autenticado si está válido
    if (authClientCache && Date.now() < authClientExpiry) {
      return authClientCache
    }

    // Validar que todas las variables de entorno estén presentes
    const projectId = process.env.GOOGLE_PROJECT_ID
    const privateKeyId = process.env.GOOGLE_PRIVATE_KEY_ID
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const clientId = process.env.GOOGLE_CLIENT_ID

    // Verificar que todas las variables estén definidas
    if (!projectId) throw new Error("Missing environment variable: GOOGLE_PROJECT_ID")
    if (!privateKeyId) throw new Error("Missing environment variable: GOOGLE_PRIVATE_KEY_ID")
    if (!privateKey) throw new Error("Missing environment variable: GOOGLE_PRIVATE_KEY")
    if (!clientEmail) throw new Error("Missing environment variable: GOOGLE_CLIENT_EMAIL")
    if (!clientId) throw new Error("Missing environment variable: GOOGLE_CLIENT_ID")

    const credentials = {
      type: "service_account",
      project_id: projectId,
      private_key_id: privateKeyId,
      private_key: privateKey.replace(/\\n/g, "\n"),
      client_email: clientEmail,
      client_id: clientId,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: SCOPES,
    })

    // Cachear cliente por 50 minutos (Google tokens duran 1 hora)
    authClientCache = auth
    authClientExpiry = Date.now() + (50 * 60 * 1000)

    return auth
  } catch (error) {
    console.error("Error creating auth client:", error)
    throw new Error(
      `Failed to create authentication client: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Función optimizada con paginación y cache
async function getImagesFromFolder(folderId: string, pageToken?: string, pageSize: number = 50): Promise<FolderResult> {
  try {
    const cacheKey = `folder-${folderId}-${pageToken || 'first'}-${pageSize}`
    
    // Verificar cache primero
    const cachedData = getCachedData<FolderResult>(cacheKey)
    if (cachedData) {
      console.log(`Cache hit for folder ${folderId}`)
      return cachedData
    }

    const auth = getAuthenticatedClient()
    const drive = google.drive({ version: "v3", auth })

    console.log(`Fetching images from folder: ${folderId}`)

    // Optimizar la query para mejor rendimiento
    const query = [
      `'${folderId}' in parents`,
      `mimeType contains 'image/'`,
      `trashed=false`
    ].join(' and ')

    const requestParams: drive_v3.Params$Resource$Files$List = {
      q: query,
      fields: "nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, webViewLink, parents)",
      orderBy: "createdTime desc",
      pageSize: Math.min(pageSize, 100), // Google Drive máximo es 100
      includeItemsFromAllDrives: true,
      supportsAllDrives: true
    }

    if (pageToken) {
      requestParams.pageToken = pageToken
    }

    const response = await drive.files.list(requestParams)
    const files = response.data.files || []
    
    console.log(`Found ${files.length} image files`)

    const result: FolderResult = {
      images: files.map((file): ImageData => ({
        id: file.id!,
        name: file.name!,
        url: `/api/drive/image/${file.id}?size=original`,
        thumbnailUrl: `/api/drive/image/${file.id}?size=400`,
        createdTime: file.createdTime!,
        mimeType: file.mimeType!,
        size: file.size || "0",
      })),
      nextPageToken: response.data.nextPageToken || null,
      totalCount: files.length
    }

    // Cachear resultado
    setCachedData(cacheKey, result, DEFAULT_TTL)
    
    console.log(`Successfully processed ${result.images.length} images`)
    return result
  } catch (error) {
    console.error("Error fetching images from Drive:", error)
    
    // En caso de error, intentar devolver datos cacheados aunque estén vencidos
    const staleCache = cache.get(`folder-${folderId}-${pageToken || 'first'}-${pageSize}`) as CacheEntry<FolderResult> | undefined
    if (staleCache) {
      console.log("Returning stale cache due to error")
      return { ...staleCache.data, stale: true }
    }
    
    throw error
  }
}

// Endpoint principal optimizado
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pageToken = searchParams.get('pageToken')
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '50'), 100)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Verificar que el FOLDER_ID esté configurado
    const folderId = process.env.DRIVE_FOLDER_ID
    if (!folderId) {
      return NextResponse.json(
        {
          error: "Missing DRIVE_FOLDER_ID environment variable",
          details: "Please set the DRIVE_FOLDER_ID in your .env.local file",
        },
        { status: 400 },
      )
    }

    // Si forceRefresh, limpiar cache
    if (forceRefresh) {
      cache.clear()
      console.log("Cache cleared due to force refresh")
    }

    console.log("Starting image fetch process...")
    const result = await getImagesFromFolder(folderId, pageToken || undefined, pageSize)

    const response = NextResponse.json(
      {
        success: true,
        images: result.images,
        count: result.images.length,
        nextPageToken: result.nextPageToken,
        cached: !!result.cached,
        stale: !!result.stale,
        message: `Successfully fetched ${result.images.length} images from Google Drive`,
      }
    )

    // Headers de cache mejorados
    if (result.stale) {
      // Datos stale, cache más corto
      response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
    } else {
      // Datos frescos, cache normal
      response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
    }

    // Headers adicionales para mejor performance
    response.headers.set("X-Cache-Status", result.cached ? "HIT" : "MISS")
    response.headers.set("X-Data-Fresh", result.stale ? "false" : "true")
    
    return response
  } catch (error) {
    console.error("API Error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    
    return NextResponse.json(
      {
        error: "Failed to fetch images from Google Drive",
        details: errorMessage,
        timestamp: new Date().toISOString(),
        retryAfter: 30 // Sugerir retry después de 30 segundos
      },
      { 
        status: 500,
        headers: {
          "Retry-After": "30",
          "Cache-Control": "no-cache" // No cachear errores
        }
      },
    )
  }
}

// Endpoint optimizado para imagen específica
export async function POST(request: Request) {
  try {
    const body = await request.json() as { imageId?: string }
    const { imageId } = body
    
    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    // Cache para imagen específica
    const cacheKey = `image-${imageId}`
    const cachedImage = getCachedData<ImageData>(cacheKey)
    
    if (cachedImage) {
      return NextResponse.json({
        success: true,
        image: cachedImage,
        cached: true
      }, {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=1200",
          "X-Cache-Status": "HIT"
        }
      })
    }

    const auth = getAuthenticatedClient()
    const drive = google.drive({ version: "v3", auth })

    // Obtener información del archivo específico
    const file = await drive.files.get({
      fileId: imageId,
      fields: "id, name, mimeType, size, createdTime, thumbnailLink, webViewLink, parents",
      supportsAllDrives: true
    })

    const image: ImageData = {
      id: file.data.id!,
      name: file.data.name!,
      url: `/api/drive/image/${imageId}?size=original`,
      thumbnailUrl: `/api/drive/image/${imageId}?size=400`,
      createdTime: file.data.createdTime!,
      mimeType: file.data.mimeType!,
      size: file.data.size || "0",
    }

    // Cachear imagen específica por más tiempo
    setCachedData(cacheKey, image, 10 * 60 * 1000) // 10 minutos

    return NextResponse.json(
      {
        success: true,
        image,
        cached: false
      },
      {
        headers: {
          "Cache-Control": "public, max-age=600, stale-while-revalidate=1200",
          "X-Cache-Status": "MISS"
        },
      },
    )
  } catch (error) {
    console.error("Error fetching specific image:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch image from Google Drive",
        details: error instanceof Error ? error.message : "Unknown error",
        retryAfter: 30
      },
      { 
        status: 500,
        headers: {
          "Retry-After": "30",
          "Cache-Control": "no-cache"
        }
      },
    )
  }
}