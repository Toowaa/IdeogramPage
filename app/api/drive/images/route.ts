import { NextResponse } from "next/server"
import { google } from "googleapis"

// Configuración de Google Drive
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

// Función para obtener el cliente autenticado
function getAuthenticatedClient() {
  try {
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

    return auth
  } catch (error) {
    console.error("Error creating auth client:", error)
    throw new Error(
      `Failed to create authentication client: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Función optimizada para obtener imágenes de la carpeta
async function getImagesFromFolder(folderId: string) {
  try {
    const auth = getAuthenticatedClient()
    const drive = google.drive({ version: "v3", auth })

    console.log(`Fetching images from folder: ${folderId}`)

    // Buscar archivos de imagen en la carpeta especificada
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: "nextPageToken, files(id, name, mimeType, size, createdTime, thumbnailLink, webViewLink)",
      orderBy: "createdTime desc",
      pageSize: 50,
    })

    const files = response.data.files || []
    console.log(`Found ${files.length} image files`)

    if (files.length === 0) {
      return []
    }

    // Procesar archivos para crear URLs optimizadas
    const images = files.map((file) => {
      // URLs que apuntan a nuestro endpoint local
      const thumbnailUrl = `/api/drive/image/${file.id}`
      const fullUrl = `/api/drive/image/${file.id}`

      return {
        id: file.id!,
        name: file.name!,
        url: fullUrl,
        thumbnailUrl: thumbnailUrl,
        createdTime: file.createdTime!,
        mimeType: file.mimeType!,
        size: file.size || "0",
      }
    })

    console.log(`Successfully processed ${images.length} images`)
    return images
  } catch (error) {
    console.error("Error fetching images from Drive:", error)
    throw error
  }
}

// Endpoint principal para obtener todas las imágenes
export async function GET() {
  try {
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

    console.log("Starting image fetch process...")

    const images = await getImagesFromFolder(folderId)

    return NextResponse.json(
      {
        success: true,
        images,
        count: images.length,
        message: `Successfully fetched ${images.length} images from Google Drive`,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("API Error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

    return NextResponse.json(
      {
        error: "Failed to fetch images from Google Drive",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Endpoint para obtener una imagen específica
export async function POST(request: Request) {
  try {
    const { imageId } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    const auth = getAuthenticatedClient()
    const drive = google.drive({ version: "v3", auth })

    // Obtener información del archivo específico
    const file = await drive.files.get({
      fileId: imageId,
      fields: "id, name, mimeType, size, createdTime, thumbnailLink, webViewLink",
    })

    const thumbnailUrl = `/api/drive/image/${imageId}`
    const fullUrl = `/api/drive/image/${imageId}`

    const image = {
      id: file.data.id!,
      name: file.data.name!,
      url: fullUrl,
      thumbnailUrl: thumbnailUrl,
      createdTime: file.data.createdTime!,
      mimeType: file.data.mimeType!,
      size: file.data.size || "0",
    }

    return NextResponse.json(
      {
        success: true,
        image,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("Error fetching specific image:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch image from Google Drive",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
