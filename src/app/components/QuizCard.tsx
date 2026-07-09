'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore';
import { HelpCircle, Award, ShieldAlert } from 'lucide-react';

export default function QuizCard() {
  const quiz = useGameStore((state) => state.quizActivo);
  const responderQuizPregunta = useGameStore((state) => state.responderQuizPregunta);
  const cerrarQuiz = useGameStore((state) => state.cerrarQuiz);

  const [indexSeleccionado, setIndexSeleccionado] = useState<number | null>(null);
  const [resultadoFeedback, setResultadoFeedback] = useState<{ exito: boolean; mensaje: string; microcopy: string } | null>(null);

  if (!quiz) return null;

  const handleEvaluarRespuesta = (idx: number) => {
    if (indexSeleccionado !== null) return; // Evitar doble toque accidental en celulares
    setIndexSeleccionado(idx);
    
    const respuesta = responderQuizPregunta(idx);
    setResultadoFeedback(respuesta);
  };

  const handleContinuar = () => {
    setIndexSeleccionado(null);
    setResultadoFeedback(null);
    cerrarQuiz();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-900 dark:text-white relative overflow-hidden"
        >
          {/* Encabezado del Cuestionario */}
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <HelpCircle size={20} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-500 font-mono">Fondo de Estímulo Geográfico</h3>
              <p className="text-[10px] text-slate-400">Responde correctamente para reclamar subsidios federales</p>
            </div>
          </div>

          {/* Bloque del Texto de la Pregunta */}
          <div className="my-5 text-sm font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-sans whitespace-pre-line">
            {quiz.pregunta}
          </div>

          {/* Opciones de Selección Múltiple */}
          <div className="space-y-2">
            {quiz.opciones.map((opcion, idx) => {
              const esEsta = indexSeleccionado === idx;
              const esCorrecta = quiz.indexCorrecto === idx;
              
              // Ebanistería de estilos CSS interactivos post-clic
              let claseBoton = 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
              if (indexSeleccionado !== null) {
                if (esCorrecta) {
                  claseBoton = 'bg-emerald-500 border-emerald-600 text-slate-950 font-black';
                } else if (esEsta) {
                  claseBoton = 'bg-rose-500 border-rose-600 text-white font-bold';
                } else {
                  claseBoton = 'opacity-40 border-transparent cursor-not-allowed text-slate-400 dark:text-slate-600';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={indexSeleccionado !== null}
                  onClick={() => handleEvaluarRespuesta(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold transition-all flex justify-between items-center ${claseBoton}`}
                >
                  <span>{opcion}</span>
                  {indexSeleccionado !== null && esCorrecta && (
                    <span className="text-[10px] font-mono uppercase tracking-wider bg-slate-950/20 px-2 py-0.5 rounded">
                      Correcto
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Despliegue de Feedback Evaluativo Avanzado */}
          <AnimatePresence>
            {resultadoFeedback && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center flex flex-col items-center overflow-hidden"
              >
                {resultadoFeedback.exito ? (
                  <div className="flex items-center gap-1 text-emerald-500 font-black text-sm">
                    <Award size={16} /> {resultadoFeedback.mensaje}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-rose-500 font-bold text-sm">
                    <ShieldAlert size={16} /> {resultadoFeedback.mensaje}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed px-2">
                  {resultadoFeedback.microcopy}
                </p>

                <button
                  onClick={handleContinuar}
                  className="mt-4 px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95"
                >
                  Continuar
                </button>
              </motion.div>
                )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}