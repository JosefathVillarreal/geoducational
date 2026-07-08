// src/app/components/AlertasContainer.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';

// ⚡ LA CLAVE: Asegúrate de que tenga el 'export' al principio de la línea
export const AlertasContainer = () => {
  const alertas = useGameStore((state) => state.alertas);
  const removerAlerta = useGameStore((state) => state.removerAlerta);

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 w-80 pointer-events-none">
      <AnimatePresence>
        {alertas.slice(-3).map((alerta) => {
          const esMax = alerta.tipo === 'max_level';
          
          return (
            <motion.div
              key={alerta.id}
              layout
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={() => removerAlerta(alerta.id)} // Permite cerrarla al hacer clic
              className={`pointer-events-auto cursor-pointer rounded-xl p-4 shadow-2xl backdrop-blur-md flex gap-3 items-start border ${
                esMax 
                  ? 'bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 bg-[length:200%_auto] animate-[shimmer_2s_linear_infinite] text-white border-yellow-400' 
                  : 'bg-zinc-900/95 text-white border-zinc-800'
              }`}
            >
              <span className="text-2xl">{alerta.icono}</span>
              <div>
                <h4 className="font-bold text-sm">{alerta.mensaje}</h4>
                <p className={`${esMax ? 'text-amber-100' : 'text-zinc-400'} text-xs mt-0.5 leading-relaxed`}>
                  {alerta.microcopy}
                </p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};