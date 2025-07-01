"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  ImageIcon,
  Square,
  Smartphone,
  Monitor,
  Tablet,
  GalleryHorizontalEnd,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [messages, setMessages] = useState<
    Array<{ id: number; text: string; isUser: boolean }>
  >([]);
  const [input, setInput] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [chatStarted, setChatStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      if (!chatStarted) {
        setChatStarted(true);
      }

      const newMessage = {
        id: Date.now(),
        text: input,
        isUser: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      setInput("");

      // Simular respuesta del bot
      setTimeout(() => {
        const botResponse = {
          id: Date.now() + 1,
          text: `Entendido! Voy a generar una imagen con proporción ${selectedRatio} basada en: "${input}"`,
          isUser: false,
        };
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const ratioOptions = [
    { id: "1:1", label: "1:1", icon: Square, description: "Cuadrado" },
    { id: "9:16", label: "9:16", icon: Smartphone, description: "Vertical" },
    { id: "16:9", label: "16:9", icon: Monitor, description: "Horizontal" },
    { id: "4:3", label: "4:3", icon: Tablet, description: "Clásico" },
  ];

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
      <div className="relative z-10 flex h-screen">
        {/* Área principal del chat */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Título y descripción - se ocultan cuando inicia el chat */}
          <div
            className={`text-center mb-8 transition-all duration-700 ${
              chatStarted
                ? "opacity-0 -translate-y-8 pointer-events-none"
                : "opacity-100 translate-y-0"
            }`}
          >
            <h1 className="text-6xl font-bold  mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              AI Image Generator
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Describe tu imagen perfecta y déjanos crearla para ti con
              inteligencia artificial
            </p>
          </div>

          {/* Contenedor del chat */}
          <div
            className={`w-full max-w-4xl transition-all duration-700 ease-out ${
              chatStarted ? "translate-y-0" : "translate-y-0"
            }`}
          >
            {/* Área de mensajes - solo visible cuando hay mensajes */}
            {messages.length > 0 && (
              <div className="mb-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 ${
                          message.isUser
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white"
                            : "bg-white/10 text-gray-100"
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* Input del chat */}
            <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe la imagen que quieres generar..."
                    className="w-full bg-transparent text-white placeholder-gray-400 text-lg focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra lateral derecha */}
        <div className="w-80 p-6 backdrop-blur-md bg-white/5 border-l border-white/10 flex flex-col h-full">
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Proporción de Imagen
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {ratioOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedRatio(option.id)}
                      className={`p-4 rounded-xl backdrop-blur-md border transition-all duration-200 transform hover:scale-105 ${
                        selectedRatio === option.id
                          ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 shadow-lg"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <IconComponent className="w-8 h-8 text-white" />
                        <span className="text-white font-medium">
                          {option.label}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {option.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones adicionales */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">
                Configuración
              </h3>
              <div className="space-y-3">
                <button className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
                  Estilo Realista
                </button>
                <button className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
                  Estilo Artístico
                </button>
                <button className="w-full p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200">
                  Alta Calidad
                </button>
              </div>
            </div>

            {/* Información */}
            <div className="backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-4">
              <h4 className="text-white font-medium mb-2">💡 Consejos</h4>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Sé específico en tu descripción</li>
                <li>• Menciona colores y estilos</li>
                <li>• Incluye detalles del ambiente</li>
              </ul>
            </div>
          </div>
          <Link href="/make">
            <button
              className="w-full backdrop-blur-md bg-white/5 rounded-xl border border-white/10 
          hover:bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:scale-105
          p-4 mt-auto transition-all duration-200 flex items-center justify-center gap-2"
            >
              <GalleryHorizontalEnd /> Ver todas las imágenes
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
