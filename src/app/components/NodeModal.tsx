'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { X, TrendingUp, Lock, GitCommit, BarChart3 } from 'lucide-react';

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
    }, 60000); // Rota exactamente cada minuto
    return () => clearInterval(intervalo);
  }, [municipio]);

  if (!municipio) return null;

  const estaComprado = municipio.nivelActual > 0;
  const costoOperacion = estaComprado 
    ? Math.floor(municipio.precioBase * Math.pow(1.8, municipio.nivelActual))
    : municipio.precioBase;

  const puedePagar = dinero >= costoOperacion;

  // Generador vectorial visual de barras de progreso (Nivel 1 al 10)
  const renderizarBarraNivel = (nivel: number) => {
    const celdasActivas = nivel;
    const celdasVacias = 10 - nivel;
    return (
      <div className="flex gap-0.5 mt-1 font-mono text-[11px] text-emerald-400 tracking-widest">
        {'🟩'.repeat(celdasActivas)}
        {'⬛'.repeat(celdasVacias)}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 120, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 120, scale: 0.95 }}
        className="absolute bottom-6 right-6 z-[1000] w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-2xl text-slate-900 dark:text-white transition-colors duration-300"
      >
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              📍 {municipio.nombre}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              👥 Población: {municipio.poblacion.toLocaleString('es-MX')} hab.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition">
            <X size={16} />
          </button>
        </div>

        {/* CAJA DE TRIVIA ENRIQUECIDA CON EMOJIS */}
        <div className="my-5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl min-h-[100px] flex flex-col justify-between shadow-inner">
          <span className="text-[9px] uppercase tracking-widest text-sky-600 dark:text-emerald-400 font-bold font-mono block">
            📡 Transmisión Satelital de Trivia
          </span>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans mt-2 italic font-medium">
            {municipio.datosCuriosos[triviaIndex]}
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
          {estaComprado && (
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold font-mono block uppercase">Progreso Operacional</span>
              {renderizarBarraNivel(municipio.nivelActual)}
            </div>
          )}

          {estaComprado && (
            <button
              onClick={() => (window as any).dispararModoConstruccion?.()}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95 transition"
            >
              <GitCommit size={14} className="animate-spin" /> Trazar Carretera Federal ⇄
            </button>
          )}

          <button
            disabled={!puedePagar || municipio.nivelActual >= 10}
            onClick={() => subirNivelNodo(municipio.id)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              municipio.nivelActual >= 10
                ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                : puedePagar
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            {municipio.nivelActual >= 10 ? (
              '🏢 Nodo al Máximo Potencial'
            ) : !estaComprado ? (
              <>
                <Lock size={14} /> Adquirir Municipio por ${costoOperacion}
              </>
            ) : (
              <>
                <TrendingUp size={14} /> Subir Nivel Comercial a {municipio.nivelActual + 1} por ${costoOperacion}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}