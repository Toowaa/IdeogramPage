"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Grid3X3, List, LayoutGrid, Check, Eye } from "lucide-react"
import Link from "next/link"
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card"

// Datos simulados de imágenes generadas
const mockImages = [
  {
    id: 1,
    url: "/placeholder.svg?height=400&width=400",
    prompt: "Un paisaje futurista con montañas cristalinas",
    ratio: "1:1",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    url: "/placeholder.svg?height=600&width=400",
    prompt: "Retrato de una mujer con cabello de colores",
    ratio: "9:16",
    timestamp: "2024-01-15T11:15:00Z",
  },
  {
    id: 3,
    url: "/placeholder.svg?height=400&width=600",
    prompt: "Ciudad cyberpunk en la noche",
    ratio: "16:9",
    timestamp: "2024-01-15T12:00:00Z",
  },
  {
    id: 4,
    url: "/placeholder.svg?height=400&width=400",
    prompt: "Gato espacial flotando entre estrellas",
    ratio: "1:1",
    timestamp: "2024-01-15T12:45:00Z",
  },
  {
    id: 5,
    url: "/placeholder.svg?height=600&width=400",
    prompt: "Bosque mágico con luces brillantes",
    ratio: "9:16",
    timestamp: "2024-01-15T13:30:00Z",
  },
  {
    id: 6,
    url: "/placeholder.svg?height=400&width=600",
    prompt: "Océano con criaturas bioluminiscentes",
    ratio: "16:9",
    timestamp: "2024-01-15T14:15:00Z",
  },
]

type ViewMode = "grid" | "list" | "masonry"

export default function GalleryPage() {
  const [selectedImages, setSelectedImages] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const router = useRouter()

  const toggleImageSelection = (imageId: number) => {
    setSelectedImages((prev) => (prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]))
  }

  const selectAll = () => {
    setSelectedImages(mockImages.map((img) => img.id))
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const viewModeOptions = [
    { id: "grid", icon: Grid3X3, label: "Cuadrícula" },
    { id: "list", icon: List, label: "Lista" },
    { id: "masonry", icon: LayoutGrid, label: "Mosaico" },
  ]

  const navigateToImage = (imageId: number) => {
    if ("startViewTransition" in document) {
      ;(document as any).startViewTransition(() => {
        router.push(`/make/${imageId}`)
      })
    } else {
      router.push(`/make/${imageId}`)
    }
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
              <h1 className="text-2xl font-bold text-white">Galería de Imágenes</h1>
              <span className="text-gray-400">({mockImages.length} imágenes)</span>
            </div>

            {/* Controles de vista */}
            <div className="flex items-center space-x-4">
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
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mockImages.map((image) => (
                <CardContainer key={image.id} className="inter-var">
                  <CardBody className="relative group cursor-pointer h-auto w-full">
                    <CardItem
                      translateZ="50"
                      className="w-full backdrop-blur-md bg-white/10 border border-white/20 rounded-xl overflow-hidden"
                    >
                      <div className="relative">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={image.prompt}
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
                        <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-purple-400 text-xs">{image.ratio}</span>
                          <span className="text-gray-400 text-xs">
                            {new Date(image.timestamp).toLocaleDateString()}
                          </span>
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
              {mockImages.map((image) => (
                <div
                  key={image.id}
                  className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 flex items-center space-x-4 group cursor-pointer hover:bg-white/20 transition-all duration-200"
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      selectedImages.includes(image.id)
                        ? "bg-purple-500 border-purple-500"
                        : "border-white bg-transparent"
                    }`}
                  >
                    {selectedImages.includes(image.id) && <Check className="w-3 h-3 text-white" />}
                  </div>

                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.prompt}
                    className="w-16 h-16 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <p className="text-white font-medium">{image.prompt}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-purple-400 text-sm">{image.ratio}</span>
                      <span className="text-gray-400 text-sm">{new Date(image.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "masonry" && (
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {mockImages.map((image) => (
                <div
                  key={image.id}
                  className="break-inside-avoid backdrop-blur-md bg-white/10 border border-white/20 rounded-xl overflow-hidden group cursor-pointer hover:bg-white/20 transition-all duration-200"
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <div className="relative">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.prompt}
                      className="w-full h-auto object-cover"
                    />

                    {/* Overlay de selección */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
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
                    <p className="text-white text-sm line-clamp-2">{image.prompt}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-purple-400 text-xs">{image.ratio}</span>
                      <span className="text-gray-400 text-xs">{new Date(image.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
