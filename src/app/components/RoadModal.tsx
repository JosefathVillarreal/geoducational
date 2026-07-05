'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
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

  const costoMejora = carretera.carriles * 300;
  const puedePagar = dinero >= costoMejora;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="absolute bottom-6 right-6 z-[1000] w-96 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-2xl text-white"
      >
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-sky-400 font-mono">Eje Vial Federal</h2>
            <p className="text-md font-black">{origen.nombre} ⇄ {destino.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="my-4 grid grid-cols-2 gap-2 text-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 font-mono block">CAPACIDAD ACTUAL</span>
            <span className="text-lg font-bold text-white font-mono">{carretera.carriles} Carriles</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono block">TIPO DE VECTOR</span>
            <span className="text-xs font-bold text-emerald-400 mt-1 block uppercase">Doble Vía (Ida/Vuelta)</span>
          </div>
        </div>

        <button
          disabled={!puedePagar || carretera.carriles >= 6}
          onClick={() => mejorarCarretera(carretera.id)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            carretera.carriles >= 6
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : puedePagar
              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {carretera.carriles >= 6 ? (
            'Capacidad de Autopista Máxima (6 Carriles)'
          ) : (
            <>
              <Hammer size={14} /> Ampliar a {carretera.carriles + 1} Carriles por ${costoMejora}
            </>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}