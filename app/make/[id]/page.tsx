"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Download, Share2, Heart, MoreHorizontal, ZoomIn, ZoomOut, Loader2, ExternalLink, ExternalLinkIcon } from "lucide-react"
import { ImageLoader } from "@/components/ui/image-loader"

interface DriveImage {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  createdTime: string
  mimeType: string
  size: string
}

export default function ImageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [image, setImage] = useState<DriveImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)


  useEffect(() => {
    const fetchImage = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        setError(null)

        const imageId = params.id as string
      

        const response = await fetch("/api/drive/images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageId }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.details || `Error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.details || data.error)
        }


        setImage(data.image)
      } catch (err) {
        console.error("❌ Error fetching image:", err)
        setError(err instanceof Error ? err.message : "Error al cargar la imagen")
      } finally {
        setLoading(false)
      }
    }

    fetchImage()
  }, [params.id])

  const navigateBack = () => {
    if ("startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        router.push("/make")
      })
    } else {
      router.push("/make")
    }
  }

  const downloadImage = async () => {
    if (!image) return

    try {

      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = image.name || `image-${image.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("❌ Error downloading image:", error)
      alert("Error al descargar la imagen")
    }
  }

  const shareImage = async () => {
    if (!image) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Imagen de Google Drive",
          text: image.name,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert("URL copiada al clipboard!")
      }
    } catch (err) {
       console.error("Error sharing:", err)
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = Number.parseInt(bytes)
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Estado de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Cargando detalles de la imagen...</p>
          <p className="text-gray-400 text-sm">Obteniendo información desde Google Drive</p>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Elementos de fondo para efecto glass */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center max-w-md mx-auto">
            <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-xl font-bold text-red-400 mb-2">Error al cargar la imagen</h2>
              <p className="text-gray-300 mb-6 text-sm">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  Reintentar
                </button>
                <button
                  onClick={navigateBack}
                  className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Volver a la galería
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay imagen después de cargar
  if (!image) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <p className="text-white text-lg mb-4">Imagen no encontrada</p>
          <button
            onClick={navigateBack}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Volver a la galería
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Elementos de fondo para efecto glass */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 backdrop-blur-md bg-white/5 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={navigateBack}
              className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Detalle de Imagen</h1>
              <p className="text-gray-400 text-sm truncate max-w-xs">{image.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
       
            <button
              onClick={shareImage}
              className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={downloadImage}
              className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
            </button>
          
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Imagen principal */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center">
            <div
              className={`relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 max-w-full max-h-full ${
                isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {/* Imagen con el nuevo ImageLoader */}
              <ImageLoader
                src={image.url || "/placeholder.svg"}
                alt={image.name}
                className="max-w-[66vh] max-h-full object-contain"
                style={{ viewTransitionName: `image-${image.id}` }}
              />

              {/* Overlay de zoom */}
              <div className="absolute top-4 right-4 p-2 rounded-lg backdrop-blur-md bg-white/20 border border-white/30 text-white opacity-0 hover:opacity-100 transition-opacity duration-200">
                {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>

        {/* Panel de información */}
        <div className="w-full lg:w-96 backdrop-blur-md bg-white/5 border-l border-white/10 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Nombre del archivo */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
             
                Nombre del archivo
              </h3>
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4">
                <p className="text-gray-200 leading-relaxed break-words text-sm">{image.name}</p>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
               
                Detalles técnicos
              </h3>
              <div className="space-y-3">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Tipo de archivo</span>
                    <span className="text-white font-medium text-sm">{image.mimeType}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Tamaño</span>
                    <span className="text-white font-medium text-sm">{formatFileSize(image.size)}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">ID de archivo</span>
                    <span className="text-white font-mono text-xs truncate max-w-32" title={image.id}>
                      {image.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información temporal */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
              
                Información
              </h3>
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 text-sm">Fecha de creación</span>
                  <span className="text-white font-medium text-sm text-right">{formatDate(image.createdTime)}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
              
                Acciones
              </h3>
              <div className="space-y-3">
                <button
                  onClick={downloadImage}
                  className="w-full p-3 rounded-xl backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar Imagen
                </button>
                <button
                  onClick={shareImage}
                  className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
                <button
                  onClick={() => window.open(image.url, "_blank")}
                  className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span className="text-sm"><ExternalLinkIcon className="w-4 h-4" /></span>
                  Abrir en Drive
                </button>
              </div>
            </div>

          
          </div>
        </div>
      </main>
    </div>
  )
}
