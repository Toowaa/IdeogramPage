import { NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"

// Cache en memoria para metadatos de archivos (evita consultas repetidas)
const fileMetadataCache = new Map<string, {
  mimeType: string
  name: string
  size: number
  timestamp: number
}>()

// Cache TTL: 5 minutos para metadatos
const METADATA_CACHE_TTL = 5 * 60 * 1000

// Cliente de Google Drive singleton (reutilizable)
let driveClient: any = null

function getAuthenticatedClient() {
  if (driveClient) return driveClient

  try {
    const projectId = process.env.GOOGLE_PROJECT_ID
    const privateKeyId = process.env.GOOGLE_PRIVATE_KEY_ID
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const clientId = process.env.GOOGLE_CLIENT_ID

    if (!projectId || !privateKeyId || !privateKey || !clientEmail || !clientId) {
      throw new Error("Missing required Google Drive environment variables")
    }

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
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    })

    driveClient = google.drive({ version: "v3", auth })
    return driveClient
  } catch (error) {
    console.error("Error creating auth client:", error)
    throw new Error(`Failed to create authentication client: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Función para obtener metadatos con cache
async function getFileMetadata(drive: any, imageId: string) {
  const cacheKey = imageId
  const cached = fileMetadataCache.get(cacheKey)
  
  // Verificar si el cache es válido
  if (cached && (Date.now() - cached.timestamp) < METADATA_CACHE_TTL) {
    return cached
  }

  try {
    const fileInfo = await drive.files.get({
      fileId: imageId,
      fields: "mimeType, name, size, modifiedTime",
    })

    const metadata = {
      mimeType: fileInfo.data.mimeType || "image/jpeg",
      name: fileInfo.data.name || `image-${imageId}`,
      size: parseInt(fileInfo.data.size || "0"),
      timestamp: Date.now()
    }

    // Guardar en cache
    fileMetadataCache.set(cacheKey, metadata)
    
    // Limpiar entradas expiradas del cache cada 100 consultas
    if (fileMetadataCache.size > 100) {
      const now = Date.now()
      for (const [key, value] of fileMetadataCache.entries()) {
        if (now - value.timestamp > METADATA_CACHE_TTL) {
          fileMetadataCache.delete(key)
        }
      }
    }

    return metadata
  } catch (error) {
    // Limpiar cache si hay error
    fileMetadataCache.delete(cacheKey)
    throw error
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const imageId = resolvedParams.id

    if (!imageId || imageId.trim() === "") {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    // Validar formato básico del ID (Google Drive IDs son alfanuméricos)
    if (!/^[a-zA-Z0-9_-]+$/.test(imageId)) {
      return NextResponse.json({ error: "Invalid image ID format" }, { status: 400 })
    }

    const drive = getAuthenticatedClient()

    // Obtener metadatos con cache
    const metadata = await getFileMetadata(drive, imageId)

    // Verificar si el cliente ya tiene la imagen en cache (ETag)
    const ifNoneMatch = request.headers.get("if-none-match")
    const etag = `"${imageId}-${metadata.timestamp}"`
    
    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }

    // Soporte para HEAD requests (solo headers, sin contenido)
    if (request.method === "HEAD") {
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Content-Type": metadata.mimeType,
          "Content-Length": metadata.size.toString(),
          "ETag": etag,
          "Cache-Control": "public, max-age=31536000, immutable",
          "Accept-Ranges": "bytes",
        }
      })
    }

    // Obtener el archivo como stream de Google Drive
    const driveResponse = await drive.files.get(
      {
        fileId: imageId,
        alt: "media",
      },
      {
        responseType: "stream",
      }
    )

    // Crear ReadableStream optimizado para Next.js
    const stream = new ReadableStream({
      start(controller) {
        driveResponse.data.on("data", (chunk: Buffer) => {
          controller.enqueue(chunk)
        })

        driveResponse.data.on("end", () => {
          controller.close()
        })

        driveResponse.data.on("error", (error: Error) => {
          console.error("Stream error:", error)
          controller.error(error)
        })
      },
      cancel() {
        // Limpiar recursos si el stream se cancela
        if (driveResponse.data.destroy) {
          driveResponse.data.destroy()
        }
      }
    })

    // Headers optimizados para máximo rendimiento
    const headers = new Headers({
      "Content-Type": metadata.mimeType,
      "Content-Length": metadata.size.toString(),
      "ETag": etag,
      "Last-Modified": new Date().toUTCString(),
      
      // Cache muy agresivo para imágenes (1 año)
      "Cache-Control": "public, max-age=31536000, immutable, stale-while-revalidate=86400",
      
      // Optimizaciones de transferencia
      "Accept-Ranges": "bytes",
      "Connection": "keep-alive",
      "Vary": "Accept-Encoding",
      
      // Seguridad básica
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "SAMEORIGIN",
      
      // CORS optimizado
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, If-None-Match, If-Modified-Since",
      "Access-Control-Expose-Headers": "Content-Length, ETag, Last-Modified",
      "Access-Control-Max-Age": "86400",
      
      // Filename para descargas
      "Content-Disposition": `inline; filename="${encodeURIComponent(metadata.name)}"`,
    })

    // Respuesta con stream para transferencia eficiente
    return new NextResponse(stream, {
      status: 200,
      headers,
    })

  } catch (error) {
    console.error("❌ Error serving image:", error)

    const resolvedParams = await params
    const imageId = resolvedParams.id

    if (error instanceof Error) {
      // Error 404 - Archivo no encontrado
      if (error.message.includes("File not found") || error.message.includes("notFound")) {
        return NextResponse.json(
          {
            error: "Image not found",
            code: "IMAGE_NOT_FOUND",
            imageId,
          },
          { 
            status: 404,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
            }
          }
        )
      }

      // Error 403 - Sin permisos
      if (error.message.includes("Permission denied") || error.message.includes("Forbidden")) {
        return NextResponse.json(
          {
            error: "Access denied",
            code: "ACCESS_DENIED",
            imageId,
          },
          { 
            status: 403,
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate",
            }
          }
        )
      }

      // Error 429 - Rate limit de Google Drive
      if (error.message.includes("quotaExceeded") || error.message.includes("rateLimitExceeded")) {
        return NextResponse.json(
          {
            error: "Service temporarily unavailable",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: 60,
          },
          { 
            status: 429,
            headers: {
              "Retry-After": "60",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            }
          }
        )
      }
    }

    // Error genérico del servidor
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        imageId,
        timestamp: new Date().toISOString(),
      },
      { 
        status: 500,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        }
      }
    )
  }
}

// Soporte para OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, If-None-Match, If-Modified-Since",
      "Access-Control-Max-Age": "86400",
    },
  })
}