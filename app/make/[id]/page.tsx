"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Download, Share2, Heart, MoreHorizontal, ZoomIn, ZoomOut } from "lucide-react"

// Datos simulados (en una app real vendrían de una API)
const mockImages = [
  {
    id: 1,
    url: "/placeholder.svg?height=800&width=800",
    prompt:
      "Un paisaje futurista con montañas cristalinas bajo un cielo púrpura, con estructuras de cristal flotantes y luces neón",
    ratio: "1:1",
    timestamp: "2024-01-15T10:30:00Z",
    model: "DALL-E 3",
    steps: 50,
    seed: 123456789,
    cfg: 7.5,
  },
  {
    id: 2,
    url: "/placeholder.svg?height=1200&width=800",
    prompt: "Retrato de una mujer con cabello de colores vibrantes, estilo cyberpunk, iluminación neón",
    ratio: "9:16",
    timestamp: "2024-01-15T11:15:00Z",
    model: "Midjourney",
    steps: 30,
    seed: 987654321,
    cfg: 8.0,
  },
  {
    id: 3,
    url: "/placeholder.svg?height=600&width=1200",
    prompt: "Ciudad cyberpunk en la noche con rascacielos iluminados y coches voladores",
    ratio: "16:9",
    timestamp: "2024-01-15T12:00:00Z",
    model: "Stable Diffusion",
    steps: 40,
    seed: 456789123,
    cfg: 9.0,
  },
  {
    id: 4,
    url: "/placeholder.svg?height=800&width=800",
    prompt: "Gato espacial flotando entre estrellas y nebulosas coloridas, arte digital fantástico",
    ratio: "1:1",
    timestamp: "2024-01-15T12:45:00Z",
    model: "DALL-E 3",
    steps: 45,
    seed: 789123456,
    cfg: 7.0,
  },
  {
    id: 5,
    url: "/placeholder.svg?height=1200&width=800",
    prompt: "Bosque mágico con luces brillantes, hadas y criaturas místicas, ambiente encantado",
    ratio: "9:16",
    timestamp: "2024-01-15T13:30:00Z",
    model: "Midjourney",
    steps: 35,
    seed: 321654987,
    cfg: 8.5,
  },
  {
    id: 6,
    url: "/placeholder.svg?height=600&width=1200",
    prompt: "Océano profundo con criaturas bioluminiscentes y corales brillantes, mundo submarino",
    ratio: "16:9",
    timestamp: "2024-01-15T14:15:00Z",
    model: "Stable Diffusion",
    steps: 50,
    seed: 654987321,
    cfg: 7.8,
  },
]

export default function ImageDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [image, setImage] = useState<any>(null)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const imageId = Number.parseInt(params.id as string)
    const foundImage = mockImages.find((img) => img.id === imageId)
    setImage(foundImage)
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

  const downloadImage = () => {
    // Simular descarga
    const link = document.createElement("a")
    link.href = image.url
    link.download = `ai-image-${image.id}.png`
    link.click()
  }

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Imagen generada por IA",
          text: image.prompt,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copiar URL al clipboard
      navigator.clipboard.writeText(window.location.href)
      alert("URL copiada al clipboard!")
    }
  }

  if (!image) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
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
            <h1 className="text-xl font-bold text-white">Detalle de Imagen</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200 transform hover:scale-105 ${
                isLiked ? "bg-red-500/20 text-red-400 border-red-400/30" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </button>
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
            <button className="p-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 transform hover:scale-105">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative z-10 flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Imagen principal */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="relative max-w-4xl max-h-full">
            <div
              className={`relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${
                isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={image.url || "/placeholder.svg"}
                alt={image.prompt}
                className="w-full h-auto max-h-[80vh] object-contain"
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
            {/* Prompt */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3">Descripción</h3>
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4">
                <p className="text-gray-200 leading-relaxed">{image.prompt}</p>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3">Detalles Técnicos</h3>
              <div className="space-y-3">
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Modelo</span>
                    <span className="text-white font-medium">{image.model}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Proporción</span>
                    <span className="text-white font-medium">{image.ratio}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pasos</span>
                    <span className="text-white font-medium">{image.steps}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">CFG Scale</span>
                    <span className="text-white font-medium">{image.cfg}</span>
                  </div>
                </div>
                <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Seed</span>
                    <span className="text-white font-medium font-mono text-sm">{image.seed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fecha de creación */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3">Información</h3>
              <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Creado</span>
                  <span className="text-white font-medium">
                    {new Date(image.timestamp).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-3">Acciones</h3>
              <div className="space-y-3">
                <button
                  onClick={downloadImage}
                  className="w-full p-3 rounded-xl backdrop-blur-md bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 transform hover:scale-105"
                >
                  Descargar Imagen
                </button>
                <button className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
                  Usar como Referencia
                </button>
                <button className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
                  Generar Variaciones
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
