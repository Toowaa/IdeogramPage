import { NextResponse } from "next/server"
import { google } from "googleapis"

// Función para obtener el cliente autenticado (reutilizada)
function getAuthenticatedClient() {
  try {
    const projectId = process.env.GOOGLE_PROJECT_ID
    const privateKeyId = process.env.GOOGLE_PRIVATE_KEY_ID
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    const clientId = process.env.GOOGLE_CLIENT_ID

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
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    })

    return auth
  } catch (error) {
    console.error("Error creating auth client:", error)
    throw new Error(
      `Failed to create authentication client: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

// Endpoint para servir imágenes individuales
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const imageId = params.id

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    const auth = getAuthenticatedClient()
    const drive = google.drive({ version: "v3", auth })

    // Obtener el archivo como stream
    const response = await drive.files.get(
      {
        fileId: imageId,
        alt: "media",
      },
      {
        responseType: "stream",
      },
    )

    // Obtener información del archivo para el content-type
    const fileInfo = await drive.files.get({
      fileId: imageId,
      fields: "mimeType, name",
    })

    const mimeType = fileInfo.data.mimeType || "image/jpeg"

    // Convertir el stream a buffer
    const chunks: Buffer[] = []

    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      response.data.on("end", () => {
        const buffer = Buffer.concat(chunks)

        resolve(
          new NextResponse(buffer, {
            headers: {
              "Content-Type": mimeType,
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Length": buffer.length.toString(),
            },
          }),
        )
      })

      response.data.on("error", (error: Error) => {
        console.error("Error streaming image:", error)
        reject(NextResponse.json({ error: "Failed to stream image" }, { status: 500 }))
      })
    })
  } catch (error) {
    console.error("Error serving image:", error)

    return NextResponse.json(
      {
        error: "Failed to serve image from Google Drive",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
