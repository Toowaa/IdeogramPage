"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Loader2, AlertTriangle } from "lucide-react"

interface ImageLoaderProps {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
  timeout?: number
}

export function ImageLoader({ src, alt, className = "", style, onLoad, onError, timeout = 9000 }: ImageLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Resetear estados cuando cambie la imagen
  useEffect(() => {
    // Solo procesar si hay una src válida
    if (!src || src === "/placeholder.svg") {
      return
    }

    console.log("Nueva imagen:", src)
    setIsLoading(true)
    setHasError(false)

    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Crear nuevo timeout
    timeoutRef.current = setTimeout(() => {
      console.log("Timeout: 9 segundos pasaron, mostrando error")
      setIsLoading(false)
      setHasError(true)
      onError?.()
    }, timeout)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [src, timeout, onError])

  const handleLoad = () => {
    console.log("✅ Imagen cargada exitosamente")

    // Limpiar timeout porque la imagen cargó
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    console.log("❌ Error inmediato al cargar imagen")

    // Limpiar timeout porque ya hay error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Posiciones fijas para las partículas de glitter
  const glitterParticles = [
    { left: 15, top: 10, size: 4, delay: 0, duration: 2.5, color: "from-yellow-300 to-amber-400" },
    { left: 85, top: 20, size: 3, delay: 0.3, duration: 3, color: "from-pink-300 to-rose-400" },
    { left: 25, top: 80, size: 5, delay: 0.6, duration: 2.8, color: "from-cyan-300 to-blue-400" },
    { left: 70, top: 15, size: 2, delay: 0.9, duration: 3.2, color: "from-purple-300 to-violet-400" },
    { left: 45, top: 60, size: 4, delay: 1.2, duration: 2.6, color: "from-emerald-300 to-green-400" },
    { left: 90, top: 75, size: 3, delay: 1.5, duration: 2.9, color: "from-orange-300 to-red-400" },
    { left: 10, top: 45, size: 6, delay: 1.8, duration: 3.1, color: "from-indigo-300 to-purple-400" },
    { left: 60, top: 30, size: 2, delay: 2.1, duration: 2.7, color: "from-teal-300 to-cyan-400" },
    { left: 35, top: 85, size: 4, delay: 2.4, duration: 3.3, color: "from-lime-300 to-yellow-400" },
    { left: 80, top: 50, size: 3, delay: 2.7, duration: 2.4, color: "from-fuchsia-300 to-pink-400" },
    { left: 20, top: 25, size: 5, delay: 3, duration: 2.8, color: "from-sky-300 to-blue-400" },
    { left: 55, top: 70, size: 2, delay: 3.3, duration: 3, color: "from-violet-300 to-purple-400" },
    { left: 75, top: 35, size: 4, delay: 3.6, duration: 2.5, color: "from-rose-300 to-pink-400" },
    { left: 40, top: 15, size: 3, delay: 3.9, duration: 2.9, color: "from-amber-300 to-orange-400" },
    { left: 65, top: 80, size: 6, delay: 4.2, duration: 3.1, color: "from-emerald-300 to-teal-400" },
    { left: 30, top: 55, size: 2, delay: 4.5, duration: 2.6, color: "from-blue-300 to-indigo-400" },
  ]

  // Si no hay src válida, mostrar loader glitter
  if (!src || src === "/placeholder.svg") {
    return (
      <div className={`relative overflow-hidden ${className}`} style={style}>
        <div className="absolute inset-0 z-10">
          {/* Fondo base con gradiente brillante */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90" />

          {/* Efecto de brillo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-wave" />

          {/* Partículas de glitter */}
          {isMounted && (
            <div className="absolute inset-0 overflow-hidden">
              {glitterParticles.map((particle, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full bg-gradient-to-br ${particle.color} animate-glitter-float shadow-lg`}
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                    boxShadow: `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.6), 0 0 ${particle.size * 4}px rgba(255, 255, 255, 0.3)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Ondas de brillo */}
          <div className="absolute inset-0">
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent animate-glitter-wave" />
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-glitter-wave-reverse" />
            <div className="absolute w-0.5 h-full bg-gradient-to-b from-transparent via-pink-400/60 to-transparent animate-glitter-wave-vertical" />
          </div>

          {/* Efecto de diamante central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Anillo exterior brillante */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-cyan-400/20 animate-spin-slow border-2 border-white/20 shadow-2xl" />

              {/* Anillo medio */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-emerald-400/30 animate-spin-reverse border border-white/30" />

              {/* Centro con spinner */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="backdrop-blur-md bg-white/10 border border-white/30 rounded-xl p-3 shadow-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Destellos alrededor */}
              <div className="absolute -inset-4">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg" />
                <div
                  className="w-2 h-2 bg-pink-400 rounded-full animate-ping absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"
                  style={{ animationDelay: "0.5s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-ping absolute left-0 top-1/2 transform -translate-y-1/2 shadow-lg"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-ping absolute right-0 top-1/2 transform -translate-y-1/2 shadow-lg"
                  style={{ animationDelay: "1.5s" }}
                />
              </div>
            </div>
          </div>

          {/* Texto de carga con efecto brillante */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2 shadow-xl">
              <div className=" text-sm font-medium bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
                ✨ Cargando imagen mágica...
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Efecto de loading con glitter brillante */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10">
          {/* Fondo base con gradiente brillante */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-purple-900/80 to-slate-900/90" />

          {/* Efecto de brillo de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-wave" />

          {/* Partículas de glitter */}
          {isMounted && (
            <div className="absolute inset-0 overflow-hidden">
              {glitterParticles.map((particle, i) => (
                <div
                  key={i}
                  className={`absolute rounded-full bg-gradient-to-br ${particle.color} animate-glitter-float shadow-lg`}
                  style={{
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    animationDelay: `${particle.delay}s`,
                    animationDuration: `${particle.duration}s`,
                    boxShadow: `0 0 ${particle.size * 2}px rgba(255, 255, 255, 0.6), 0 0 ${particle.size * 4}px rgba(255, 255, 255, 0.3)`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Ondas de brillo */}
          <div className="absolute inset-0">
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent animate-glitter-wave" />
            <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent animate-glitter-wave-reverse" />
            <div className="absolute w-0.5 h-full bg-gradient-to-b from-transparent via-pink-400/60 to-transparent animate-glitter-wave-vertical" />
          </div>

          {/* Efecto de diamante central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Anillo exterior brillante */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-cyan-400/20 animate-spin-slow border-2 border-white/20 shadow-2xl" />

              {/* Anillo medio */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400/30 via-blue-400/30 to-emerald-400/30 animate-spin-reverse border border-white/30" />

              {/* Centro con spinner */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="backdrop-blur-md bg-white/10 border border-white/30 rounded-xl p-3 shadow-xl">
                  <Loader2 className="w-6 h-6 animate-spin text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Destellos alrededor */}
              <div className="absolute -inset-4">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg" />
                <div
                  className="w-2 h-2 bg-pink-400 rounded-full animate-ping absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"
                  style={{ animationDelay: "0.5s" }}
                />
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-ping absolute left-0 top-1/2 transform -translate-y-1/2 shadow-lg"
                  style={{ animationDelay: "1s" }}
                />
                <div
                  className="w-2 h-2 bg-purple-400 rounded-full animate-ping absolute right-0 top-1/2 transform -translate-y-1/2 shadow-lg"
                  style={{ animationDelay: "1.5s" }}
                />
              </div>
            </div>
          </div>

          {/* Texto de carga con efecto brillante */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-4 py-2 shadow-xl">
              <div className=" text-sm font-medium bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent animate-pulse">
                ✨ Cargando imagen mágica...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imagen real */}
      {!hasError && src && src !== "/placeholder.svg" && (
        <img
          src={src || "/placeholder.svg"}
          alt={alt}
          className={`w-full h-auto object-contain transition-opacity duration-500 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Estado de error - Diseño elegante */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-gradient-to-br from-gray-900/80 to-slate-900/80 border border-gray-600/30 rounded-xl">
          <div className="text-center text-gray-300">
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-gradient-to-br from-gray-700/40 to-slate-700/40 border border-gray-600/40 flex items-center justify-center shadow-xl">
              <AlertTriangle className="w-10 h-10 text-gray-400 drop-shadow-lg" />
            </div>
            <p className="text-base font-medium text-gray-400 mb-1">Error al cargar</p>
            <p className="text-sm text-gray-500">La imagen no está disponible</p>
          </div>
        </div>
      )}
    </div>
  )
}
