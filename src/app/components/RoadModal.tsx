'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, formatearDinero } from '../store/useGameStore';
import { X, Hammer } from 'lucide-react';

interface RoadModalProps {
  roadId: string | null;
  onClose: () => void;
}

export default function RoadModal({ roadId, onClose }: RoadModalProps) {
  const dinero = useGameStore((state) => state.dinero);
  const conexiones = useGameStore((state) => state.conexiones);
  const municipios = useGameStore((state) => state.municipios);
  const mejorarCarretera = useGameStore((state) => state.mejorarCarretera);

  const carretera = conexiones.find((c) => c.id === roadId);
  const origen = carretera ? municipios[carretera.desde] : null;
  const destino = carretera ? municipios[carretera.hasta] : null;

  if (!carretera || !origen || !destino) return null;

  const costoMejora = carretera.carriles * 200000000; // $200M por carril extra
  const puedePagar = dinero >= costoMejora;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 150 }} className="fixed bottom-0 left-0 right-0 md:absolute md:top-auto md:bottom-6 md:left-auto md:right-6 z-[1050] w-full md:w-96 bg-white dark:bg-slate-900 border-t md:border border-slate-200 dark:border-slate-800 p-6 rounded-t-3xl md:rounded-2xl shadow-2xl text-slate-900 dark:text-white pb-8 md:pb-6 transition-colors duration-300">
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 md:hidden" onClick={onClose} />

        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400 font-mono">Eje Interconector</h2>
            <p className="text-base font-black">{origen.nombre} ⇄ {destino.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg"><X size={16} /></button>
        </div>

        <div className="my-4 grid grid-cols-2 gap-2 text-center bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Sección Transversal</span>
            <span className="text-base font-bold text-slate-800 dark:text-white font-mono">{carretera.carriles} Carriles</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Inversión Inicial</span>
            <span className="text-base font-bold text-emerald-500 font-mono">{formatearDinero(carretera.costoConstruccion)}</span>
          </div>
        </div>

        <button
          disabled={!puedePagar || carretera.carriles >= 6}
          onClick={() => mejorarCarretera(carretera.id)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            carretera.carriles >= 6
              ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
              : puedePagar
              ? 'bg-sky-500 hover:bg-sky-400 text-white dark:text-slate-950 font-black shadow-lg active:scale-95'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          {carretera.carriles >= 6 ? '🚀 Capacidad Vial Máxima (6 Carriles)' : `Ampliar Autopista por ${formatearDinero(costoMejora)}`}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}