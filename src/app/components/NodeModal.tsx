'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, TrendingUp, Lock, GitCommit } from 'lucide-react';

interface NodeModalProps {
  nodeId: string | null;
  onClose: () => void;
}

export default function NodeModal({ nodeId, onClose }: NodeModalProps) {
  const dinero = useGameStore((state) => state.dinero);
  const municipios = useGameStore((state) => state.municipios);
  const subirNivelNodo = useGameStore((state) => state.subirNivelNodo);

  const municipio = nodeId ? municipios[nodeId] : null;
  const [triviaIndex, setTriviaIndex] = useState(0);

  useEffect(() => {
    setTriviaIndex(0);
  }, [nodeId]);

  useEffect(() => {
    if (!municipio) return;
    const intervalo = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % municipio.datosCuriosos.length);
    }, 60000);
    return () => clearInterval(intervalo);
  }, [municipio]);

  if (!municipio) return null; // 🔐 Ocultamiento por defecto automático si no hay selección

  const estaComprado = municipio.nivelActual > 0;
  const costoOperacion = estaComprado 
    ? Math.floor(municipio.precioBase * Math.pow(1.8, municipio.nivelActual))
    : municipio.precioBase;

  const puedePagar = dinero >= costoOperacion;

  return (
    <AnimatePresence>
      <motion.div
        // 📱 RESPONSIVE UX PHYSICS: Entra desde abajo en celular, desde la derecha en PC
        initial={{ opacity: 0, y: 100, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 150 }}
        transition={{ type: 'spring', damping: 25, stiffness: 150 }}
        className="fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-6 md:left-auto md:right-6 z-[1050] w-full md:w-96 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl md:rounded-2xl shadow-2xl text-slate-900 dark:text-white pb-8 md:pb-6 transition-colors duration-300"
      >
        {/* Indicador táctil visual superior para simular arrastre de cierre en móvil */}
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

        <div className="my-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl min-h-[85px] flex flex-col justify-between">
          <span className="text-[9px] uppercase tracking-widest text-sky-600 dark:text-emerald-400 font-bold font-mono block">
            📡 Satélite Geoducational • 1 min rotación
          </span>
          <p className="text-xs md:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans mt-1.5 italic font-medium">
            {municipio.datosCuriosos[triviaIndex]}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          {estaComprado && (
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>Estatus Comercial:</span>
              <span className="text-emerald-500 font-bold">Nivel {municipio.nivelActual}/10</span>
            </div>
          )}

          {estaComprado && (
            <button
              onClick={() => (window as any).dispararModoConstruccion?.()}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition md:flex hidden"
            >
              <GitCommit size={14} className="text-sky-400 animate-spin" /> Trazar Carretera Conectora
            </button>
          )}

          {/* Indicación gestual para móvil */}
          {estaComprado && (
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-mono block md:hidden mb-1 animate-pulse">
              💡 Tip móvil: Mantén presionado este nodo en el mapa y arrástralo hacia otro para trazar vías.
            </p>
          )}

          <button
            disabled={!puedePagar || municipio.nivelActual >= 10}
            onClick={() => subirNivelNodo(municipio.id)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              municipio.nivelActual >= 10
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                : puedePagar
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg active:scale-95'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {municipio.nivelActual >= 10 ? (
              '🏢 Ecosistema Desarrollado al Máximo'
            ) : !estaComprado ? (
              <>
                <Lock size={14} /> Adquirir Municipio por ${costoOperacion}
              </>
            ) : (
              <>
                <TrendingUp size={14} /> Subir Nivel Comercial por ${costoOperacion}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}