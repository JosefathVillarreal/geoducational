'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, TrendingUp, Lock, GitCommit } from 'lucide-react';

interface NodeModalProps {
  nodeId: string | null;
  onClose: () => void;
  onBuildBridgeInit: () => void; // 🔑 Comunicación limpia vía props
}

export default function NodeModal({ nodeId, onClose, onBuildBridgeInit }: NodeModalProps) {
  const dinero = useGameStore((state) => state.dinero);
  const municipios = useGameStore((state) => state.municipios);
  const subirNivelNodo = useGameStore((state) => state.subirNivelNodo);

  const municipio = nodeId ? municipios[nodeId] : null;
  const [triviaIndex, setTriviaIndex] = useState(0);

  // Estados locales para controlar los tooltips dinámicos de fondos faltantes
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);
  const [showBridgeTooltip, setShowBridgeTooltip] = useState(false);

  useEffect(() => {
    setTriviaIndex(0);
    setShowUpgradeTooltip(false);
    setShowBridgeTooltip(false);
  }, [nodeId]);

  useEffect(() => {
    if (!municipio) return;
    const intervalo = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % municipio.datosCuriosos.length);
    }, 60000);
    return () => clearInterval(intervalo);
  }, [municipio]);

  if (!municipio) return null;

  const estaComprado = municipio.nivelActual > 0;
  
  // Costos de operación financieros
  const costoUpgrade = estaComprado 
    ? Math.floor(municipio.precioBase * Math.pow(1.8, municipio.nivelActual))
    : municipio.precioBase;

  const costoBasePuente = 500; // Umbral base estimado para habilitar el botón antes de elegir destino

  const puedePagarUpgrade = dinero >= costoUpgrade;
  const puedePagarPuente = dinero >= costoBasePuente;

  // 📈 MATEMÁTICA PROGRESIVA: Porcentaje de llenado de los botones (0 a 1)
  const progresoUpgrade = Math.min(dinero / costoUpgrade, 1);
  const progresoPuente = Math.min(dinero / costoBasePuente, 1);

  // Auto-ocultar los tooltips tras 2.5 segundos
  const dispararTooltipUpgrade = () => {
    if (!puedePagarUpgrade) {
      setShowUpgradeTooltip(true);
      setTimeout(() => setShowUpgradeTooltip(false), 2500);
    }
  };

  const dispararTooltipPuente = () => {
    if (!puedePagarPuente) {
      setShowBridgeTooltip(true);
      setTimeout(() => setShowBridgeTooltip(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 150 }}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        className="fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-6 md:left-auto md:right-6 z-[1050] w-full md:w-96 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl md:rounded-2xl shadow-2xl text-slate-900 dark:text-white pb-8 md:pb-6 transition-colors duration-300"
      >
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 md:hidden" onClick={onClose} />

        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-black tracking-tight">📍 {municipio.nombre}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              👥 Población: {municipio.poblacion.toLocaleString('es-MX')} hab.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        {/* Caja de Trivia */}
        <div className="my-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl min-h-[85px] flex flex-col justify-between">
          <span className="text-[9px] uppercase tracking-widest text-sky-600 dark:text-emerald-400 font-bold font-mono block">
            📡 Satélite Geoducational • 1 min rotación
          </span>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans mt-1.5 italic font-medium">
            {municipio.datosCuriosos[triviaIndex]}
          </p>
        </div>

        {/* CONTENEDOR DE ACCIONES MULTI-BOTÓN RESPONSIVO */}
        <div className="pt-2 flex flex-col gap-3 relative">
          
          {estaComprado ? (
            <div className="grid grid-cols-2 gap-2 relative">
              
              {/* 1️⃣ BOTÓN: SUBIR NIVEL COMERCIAL */}
              <div className="relative">
                {/* TOOLTIP INTELIGENTE DE FONDOS FALTANTES */}
                <AnimatePresence>
                  {showUpgradeTooltip && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[10px] py-1 px-2 rounded shadow-2xl border border-slate-800 z-50 whitespace-nowrap">
                      💸 Faltan ${(costoUpgrade - dinero).toLocaleString('es-MX')} MXN
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  disabled={municipio.nivelActual >= 10}
                  onClick={() => {
                    if (puedePagarUpgrade) subirNivelNodo(municipio.id);
                    else dispararTooltipUpgrade();
                  }}
                  className="relative w-full overflow-hidden py-3 px-3 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-900 dark:text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-200 dark:border-slate-700"
                >
                  {/* ⚡ ANIMACIÓN DE CARGA PROGRESIVA DE FONDO */}
                  <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 dark:bg-emerald-500/20 pointer-events-none"
                    initial={{ width: 0 }}
                    animate={{ width: `${progresoUpgrade * 100}%` }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                  <TrendingUp size={14} className={puedePagarUpgrade ? "text-emerald-500" : "text-slate-400"} />
                  <span className="relative z-10">Subir nivel</span>
                </button>
              </div>

              {/* 2️⃣ BOTÓN: CONSTRUIR PUENTE / VÍA CONNECTORA */}
              <div className="relative">
                <AnimatePresence>
                  {showBridgeTooltip && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[10px] py-1 px-2 rounded shadow-2xl border border-slate-800 z-50 whitespace-nowrap">
                      💸 Faltan ${(costoBasePuente - dinero).toLocaleString('es-MX')} MXN
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => {
                    if (puedePagarPuente) onBuildBridgeInit();
                    else dispararTooltipPuente();
                  }}
                  className={`relative w-full overflow-hidden py-3 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 border ${
                    puedePagarPuente 
                      ? 'bg-amber-500 hover:bg-amber-400 border-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/10' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {/* ⚡ ANIMACIÓN DE CARGA PROGRESIVA DE FONDO */}
                  {!puedePagarPuente && (
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-amber-500/15 dark:bg-amber-500/20 pointer-events-none"
                      initial={{ width: 0 }}
                      animate={{ width: `${progresoPuente * 100}%` }}
                      transition={{ type: 'spring', damping: 20 }}
                    />
                  )}
                  <GitCommit size={14} className={puedePagarPuente ? "text-slate-950" : "text-slate-500"} />
                  <span className="relative z-10">Puente</span>
                </button>
              </div>

            </div>
          ) : (
            /* 3️⃣ VISTA: ADQUIRIR CIUDAD / NODO BLOQUEADO */
            <div className="relative w-full">
              <AnimatePresence>
                {showUpgradeTooltip && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[10px] py-1 px-2 rounded shadow-2xl border border-slate-800 z-50 whitespace-nowrap">
                    💸 Faltan ${(costoUpgrade - dinero).toLocaleString('es-MX')} MXN para adquirir
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => {
                  if (puedePagarUpgrade) subirNivelNodo(municipio.id);
                  else dispararTooltipUpgrade();
                }}
                className={`relative w-full overflow-hidden py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 border ${
                  puedePagarUpgrade 
                    ? 'bg-emerald-500 hover:bg-emerald-400 border-emerald-600 text-slate-950 font-black shadow-xl shadow-emerald-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {/* ⚡ ANIMACIÓN DE CARGA PROGRESIVA DE FONDO */}
                {!puedePagarUpgrade && (
                  <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-emerald-500/15 dark:bg-emerald-500/20 pointer-events-none"
                    initial={{ width: 0 }}
                    animate={{ width: `${progresoUpgrade * 100}%` }}
                    transition={{ type: 'spring', damping: 20 }}
                  />
                )}
                <Lock size={14} />
                <span className="relative z-10">Adquirir ciudad</span>
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}