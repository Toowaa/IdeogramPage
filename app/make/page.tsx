"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Grid3X3, List, LayoutGrid, Check, Eye, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"

// Tipo para las imágenes de Drive
interface DriveImage {
  id: string
  name: string
  url: string
  thumbnailUrl: string
  createdTime: string
  mimeType: string
  size: string
}

type ViewMode = "grid" | "list" | "masonry"

// Componente de imagen con manejo de errores mejorado
const ImageWithFallback = ({
  src,
  alt,
  className,
  style,
  onError,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onError?: () => void
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (imageError) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-xs">Error al cargar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-800 flex items-center justify-center absolute inset-0 z-10`}>
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
        </div>
      )}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={className}
        style={style}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
    </div>
  )
}

export default function GalleryPage() {
  const [images, setImages] = useState<DriveImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [retryCount, setRetryCount] = useState(0)
  const router = useRouter()

  const fetchImagesFromDrive = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)



      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout

      const response = await fetch("/api/drive/images", {
        signal: controller.signal,
        headers: {
          "Cache-Control": "cache",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || `Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.details || data.error)
      }

 
      setImages(data.images || [])
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error("Error fetching images:", err)

      if (err instanceof Error && err.name === "AbortError") {
        setError("La solicitud tardó demasiado tiempo. Intenta de nuevo.")
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar las imágenes de Google Drive")
      }

      // Auto-retry logic (max 3 attempts)
      if (retryCount < 2) {
        setTimeout(
          () => {
            setRetryCount((prev) => prev + 1)
            fetchImagesFromDrive()
          },
          2000 * (retryCount + 1),
        ) // Exponential backoff
      }
    } finally {
      setLoading(false)
    }
  }, [retryCount])

  // Cargar imágenes al montar el componente
  useEffect(() => {
    fetchImagesFromDrive()
  }, [fetchImagesFromDrive])

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]))
  }

  const selectAll = () => {
    setSelectedImages(images.map((img) => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const viewModeOptions = [
    { id: "grid", icon: Grid3X3, label: "Cuadrícula" },
    { id: "list", icon: List, label: "Lista" },
    { id: "masonry", icon: LayoutGrid, label: "Mosaico" },
  ]

  const navigateToImage = (imageId: string) => {
    if ("startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        router.push(`/make/${imageId}`)
      })
    } else {
      router.push(`/make/${imageId}`)
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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Componente de Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">Cargando imágenes desde Google Drive...</p>
          {retryCount > 0 && <p className="text-gray-400 text-sm">Reintento {retryCount + 1}/3</p>}
        </div>
      </div>
    )
  }

  // Componente de Error
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="backdrop-blur-md bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Error al cargar las imágenes</h2>
            <p className="text-gray-300 mb-4 text-sm">{error}</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setRetryCount(0)
                  fetchImagesFromDrive()
                }}
                className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-center"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
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

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/5 border-b border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-white">Galería de Google Drive</h1>
              <span className="text-gray-400">({images.length} imágenes)</span>
            </div>

            {/* Controles de vista */}
            <div className="flex items-center space-x-4">
              {/* Botón de refrescar */}
              <button
                onClick={() => {
                  setRetryCount(0)
                  fetchImagesFromDrive()
                }}
                disabled={loading}
                className="px-3 py-1 text-sm rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </button>

              {/* Selección */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                >
                  Seleccionar todo
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
                >
                  Limpiar
                </button>
                {selectedImages.length > 0 && (
                  <span className="text-purple-400 font-medium">{selectedImages.length} seleccionadas</span>
                )}
              </div>

              {/* Modos de vista */}
              <div className="flex backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-1">
                {viewModeOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.id}
                      onClick={() => setViewMode(option.id as ViewMode)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        viewMode === option.id
                          ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={option.label}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Galería */}
        <main className="p-6">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-8 max-w-md mx-auto">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">No se encontraron imágenes</p>
                <p className="text-gray-500 text-sm">
                  Verifica que la carpeta de Google Drive contenga imágenes y que los permisos estén configurados
                  correctamente.
                </p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {images.map((image) => (
                    <CardContainer key={image.id} className="inter-var">
                      <CardBody className="relative group cursor-pointer h-auto w-full">
                        <CardItem
                          translateZ="50"
                          className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl overflow-hidden"
                        >
                          <div className="relative">
                            <ImageWithFallback
                              src={image.thumbnailUrl || "/placeholder.svg"}
                              alt={image.name}
                              className="w-full h-64 object-cover"
                              style={{ viewTransitionName: `image-${image.id}` }}
                            />

                            {/* Overlay de selección */}
                            <div
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (e.shiftKey || e.ctrlKey) {
                                  toggleImageSelection(image.id)
                                } else {
                                  navigateToImage(image.id)
                                }
                              }}
                            >
                              <div
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                  selectedImages.includes(image.id)
                                    ? "bg-purple-500 border-purple-500"
                                    : "border-white bg-transparent"
                                }`}
                              >
                                {selectedImages.includes(image.id) && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigateToImage(image.id)
                              }}
                              className="absolute top-2 right-2 p-2 rounded-lg backdrop-blur-md bg-white/20 border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/30"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>

                          <CardItem translateZ="60" className="p-4">
                            <p className="text-white text-sm font-medium line-clamp-2" title={image.name}>
                              {image.name}
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-purple-400 text-xs">{formatFileSize(image.size)}</span>
                              <span className="text-gray-400 text-xs">{formatDate(image.createdTime)}</span>
                            </div>
                          </CardItem>
                        </CardItem>
                      </CardBody>
                    </CardContainer>
                  ))}
                </div>
              )}

              {viewMode === "list" && (
                <div className="space-y-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-4 group cursor-pointer hover:bg-white/20 transition-all duration-200"
                      onClick={() => navigateToImage(image.id)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          selectedImages.includes(image.id)
                            ? "bg-purple-500 border-purple-500"
                            : "border-white bg-transparent"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleImageSelection(image.id)
                        }}
                      >
                        {selectedImages.includes(image.id) && <Check className="w-3 h-3 text-white" />}
                      </div>

                      <ImageWithFallback
                        src={image.thumbnailUrl || "/placeholder.svg"}
                        alt={image.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />

                      <div className="flex-1">
                        <p className="text-white font-medium" title={image.name}>
                          {image.name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-purple-400 text-sm">{formatFileSize(image.size)}</span>
                          <span className="text-gray-400 text-sm">{formatDate(image.createdTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === "masonry" && (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="break-inside-avoid backdrop-blur-md bg-white/10 border border-white/20 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/20 transition-all duration-200"
                      onClick={() => navigateToImage(image.id)}
                    >
                      <div className="relative">
                        <ImageWithFallback
                          src={image.thumbnailUrl || "/placeholder.svg"}
                          alt={image.name}
                          className="w-full h-auto object-cover"
                        />

                        {/* Overlay de selección */}
                        <div
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleImageSelection(image.id)
                          }}
                        >
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              selectedImages.includes(image.id)
                                ? "bg-purple-500 border-purple-500"
                                : "border-white bg-transparent"
                            }`}
                          >
                            {selectedImages.includes(image.id) && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="text-white text-sm font-medium line-clamp-2" title={image.name}>
                          {image.name}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-purple-400 text-xs">{formatFileSize(image.size)}</span>
                          <span className="text-gray-400 text-xs">{formatDate(image.createdTime)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
