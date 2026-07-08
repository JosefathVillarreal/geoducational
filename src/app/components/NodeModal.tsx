'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatearDinero } from '../store/useGameStore';
import { X, TrendingUp, Lock, GitCommit, Users, BarChart3 } from 'lucide-react';

interface NodeModalProps {
  nodeId: string | null;
  onClose: () => void;
  onBuildBridgeInit: () => void;
}

export default function NodeModal({ nodeId, onClose, onBuildBridgeInit }: NodeModalProps) {
  const dinero = useGameStore((state) => state.dinero);
  const llavesDeLaCiudad = useGameStore((state) => state.llavesDeLaCiudad);
  const municipios = useGameStore((state) => state.municipios);
  const subirNivelNodo = useGameStore((state) => state.subirNivelNodo);
  const intentarDesbloquearNodo = useGameStore((state) => state.intentarDesbloquearNodo);

  const municipio = nodeId ? municipios[nodeId] : null;
  const [triviaIndex, setTriviaIndex] = useState(0);

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
  const esMaxNivel = municipio.nivelActual >= 10;
  
  const costoUpgrade = estaComprado 
    ? Math.floor(municipio.precioBase * Math.pow(1.9, municipio.nivelActual))
    : municipio.precioBase;

  const costoBasePuente = 500000000; // $500M Base

  const puedePagarUpgrade = dinero >= costoUpgrade;
  const puedePagarPuente = dinero >= costoBasePuente;

  const progresoUpgrade = Math.min(dinero / costoUpgrade, 1);
  const progresoPuente = Math.min(dinero / costoBasePuente, 1);

  const dispararTooltipUpgrade = () => {
    if (!puedePagarUpgrade && municipio.desbloqueado && !esMaxNivel) {
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
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 150 }} className="fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-6 md:left-auto md:right-6 z-[1050] w-full md:w-96 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl md:rounded-2xl shadow-2xl text-slate-900 dark:text-white pb-8 md:pb-6 transition-colors duration-300">
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 md:hidden" onClick={onClose} />

        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-black tracking-tight">📍 {municipio.nombre}</h2>
            <div className="flex items-center gap-3 mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-0.5">
                <Users size={12} /> {municipio.poblacion.toLocaleString('es-MX')} hab.
              </span>
              {municipio.desbloqueado && (
                <span className={`flex items-center gap-0.5 font-bold ${esMaxNivel ? 'text-amber-500 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  <BarChart3 size={12} /> Lvl {esMaxNivel ? 'MAX' : municipio.nivelActual}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg"><X size={16} /></button>
        </div>

        <div className="my-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl min-h-[85px] flex flex-col justify-between">
          <span className="text-[9px] uppercase tracking-widest text-sky-600 dark:text-emerald-400 font-bold font-mono block">📡 Satélite Activo</span>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans mt-1.5 italic font-medium">
            {municipio.desbloqueado ? municipio.datosCuriosos[triviaIndex] : "🔒 Territorio bloqueado. Requiere un Token de Expansión Territorial Federal obtenido al llevar otra ciudad al nivel 10."}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 relative">
          
          {!municipio.desbloqueado ? (
            <button
              disabled={llavesDeLaCiudad <= 0}
              onClick={() => intentarDesbloquearNodo(municipio.id)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border ${
                llavesDeLaCiudad > 0 ? 'bg-amber-500 border-amber-600 text-slate-950 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed'
              }`}
            >
              <Lock size={14} /> Desbloquear con Token ({llavesDeLaCiudad})
            </button>
          ) : estaComprado ? (
            <div className="grid grid-cols-2 gap-2 relative">
              
              {/* BOTÓN SUBIR NIVEL CON REGLAS DE BLOQUEO MAX */}
              <div className="relative">
                <AnimatePresence>
                  {showUpgradeTooltip && !esMaxNivel && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[9px] py-1 px-2 rounded border border-slate-800 z-50 whitespace-nowrap shadow-2xl">
                      💸 Faltan {formatearDinero(costoUpgrade - dinero)}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  disabled={esMaxNivel}
                  onClick={() => { if (puedePagarUpgrade) subirNivelNodo(municipio.id); else dispararTooltipUpgrade(); }}
                  className={`relative w-full overflow-hidden py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition border ${
                    esMaxNivel 
                      ? 'bg-slate-200 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border-transparent cursor-not-allowed active:scale-100' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 active:scale-95'
                  }`}
                >
                  {/* Solo animar la carga si no está al máximo */}
                  {!esMaxNivel && (
                    <motion.div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 pointer-events-none" initial={{ width: 0 }} animate={{ width: `${progresoUpgrade * 100}%` }} transition={{ type: 'spring' }} />
                  )}
                  <TrendingUp size={14} className={esMaxNivel ? "text-slate-400 dark:text-slate-600" : puedePagarUpgrade ? "text-emerald-500" : "text-slate-500"} />
                  <span className="relative z-10">{esMaxNivel ? 'Nivel Máximo' : 'Subir nivel'}</span>
                </button>
              </div>

              {/* PUENTE */}
              <div className="relative">
                <AnimatePresence>
                  {showBridgeTooltip && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[9px] py-1 px-2 rounded border border-slate-800 z-50 whitespace-nowrap shadow-2xl">
                      💸 Faltan {formatearDinero(costoBasePuente - dinero)}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => { if (puedePagarPuente) onBuildBridgeInit(); else dispararTooltipPuente(); }}
                  className={`relative w-full overflow-hidden py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition border active:scale-95 ${
                    puedePagarPuente ? 'bg-amber-500 text-slate-950 border-amber-600 font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed'
                  }`}
                >
                  {!puedePagarPuente && <motion.div className="absolute left-0 top-0 bottom-0 bg-amber-500/20 pointer-events-none" initial={{ width: 0 }} animate={{ width: `${progresoPuente * 100}%` }} transition={{ type: 'spring' }} />}
                  <GitCommit size={14} />
                  <span className="relative z-10">Puente</span>
                </button>
              </div>

            </div>
          ) : (
            /* ADQUIRIR CIUDAD */
            <div className="relative w-full">
              <AnimatePresence>
                {showUpgradeTooltip && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-950 text-white font-mono text-[9px] py-1 px-2 rounded border border-slate-800 z-50 whitespace-nowrap shadow-2xl">
                    💸 Faltan {formatearDinero(costoUpgrade - dinero)}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={() => { if (puedePagarUpgrade) subirNivelNodo(municipio.id); else dispararTooltipUpgrade(); }}
                className={`relative w-full overflow-hidden py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition border active:scale-95 ${
                  puedePagarUpgrade ? 'bg-emerald-500 border-emerald-600 text-slate-950 font-black shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                {!puedePagarUpgrade && <motion.div className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 pointer-events-none" initial={{ width: 0 }} animate={{ width: `${progresoUpgrade * 100}%` }} transition={{ type: 'spring' }} />}
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