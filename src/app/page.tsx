'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMachine } from '@xstate/react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameMachine } from './machines/gameMachine';
import { useGameStore, calcularDistanciaKm, formatearDinero } from './store/useGameStore';
import NodeModal from './components/NodeModal';
import RoadModal from './components/RoadModal';
import QuizCard from './components/QuizCard';
import  { AlertasContainer } from './components/AlertasContainer'
import { Sun, Moon, ChevronDown, ChevronUp, Wallet, Map, Landmark, Globe, Key } from 'lucide-react';

const GameMap = dynamic(() => import('./components/GameMap'), {
  ssr: false,
  loading: () => <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-500 mb-4"></div><p className="text-xs font-mono text-slate-400">CARGANDO RED DE NODOS V4...</p></div>,
});

export default function Home() {
  const dinero = useGameStore((state) => state.dinero);
  const llavesDeLaCiudad = useGameStore((state) => state.llavesDeLaCiudad);
  const municipios = useGameStore((state) => state.municipios);
  const tema = useGameStore((state) => state.tema);
  const conmutarTema = useGameStore((state) => state.conmutarTema);
  const currentViewFocus = useGameStore((state) => state.currentViewFocus);
  const setViewFocus = useGameStore((state) => state.setViewFocus);
  const agregarDinero = useGameStore((state) => state.agregarDinero);
  const intentarConectarNodos = useGameStore((state) => state.intentarConectarNodos);
  const alertas = useGameStore((state) => state.alertas);
  const removerAlerta = useGameStore((state) => state.removerAlerta);

  const [isHudCollapsed, setIsHudCollapsed] = useState(false);
  const [state, send] = useMachine(gameMachine);

  useEffect(() => {
    if (alertas.length > 0) {
      const timer = setTimeout(() => {
        removerAlerta(alertas[alertas.length - 1]!.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertas, removerAlerta]);

  useEffect(() => {
    const loop = setInterval(() => {
      let ingresos = 0;
      Object.values(municipios).forEach((m) => {
        if (m.nivelActual > 0 && m.desbloqueado) {
          ingresos += m.nivelActual * 6500000; // Multiplicadores acelerados sugeridos
        }
      });
      if (ingresos > 0) agregarDinero(ingresos);
    }, 1000);
    return () => clearInterval(loop);
  }, [municipios, agregarDinero]);

  useEffect(() => {
    const cronometroQuiz = setInterval(() => {
      const adquiridos = Object.values(useGameStore.getState().municipios).filter(m => m.nivelActual > 0);
      if (adquiridos.length > 0) useGameStore.getState().lanzarQuizPregunta();
    }, 90000); // Lanzamiento optimizado cada 1.5 minutos para agilidad táctil
    return () => clearInterval(cronometroQuiz);
  }, []);

  const handleNodeClickOnMap = (id: string) => {
    if (state.matches('modoConstruccion')) {
      const origenId = state.context.selectedNodeId;
      if (origenId) intentarConectarNodos(origenId, id);
      send({ type: 'SELECT_NODE', id });
    } else {
      send({ type: 'SELECT_NODE', id });
    }
  };

  const nodoOrigenObra = state.matches('modoConstruccion') && state.context.selectedNodeId ? municipios[state.context.selectedNodeId] : null;

  return (
    <main className="relative w-full h-screen select-none overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* 🔔 NOTIFICACIONES CON EFECTO CELEBRACIÓN DE NIVEL MÁXIMO (Cromática Oro) */}
      <div className="absolute top-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {alertas.map((alerta) => {
            const esMax = alerta.tipo === 'max_level';
            return (
              <motion.div
                key={alerta.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                className={`pointer-events-auto w-full border p-4 rounded-xl shadow-2xl text-white flex items-start gap-3 relative overflow-hidden backdrop-blur-md ${
                  esMax 
                    ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-yellow-400 ring-2 ring-yellow-400/30' 
                    : 'bg-slate-900/95 border-slate-800'
                }`}
              >
                {esMax && (
                  <motion.div 
                    className="absolute inset-0 bg-white/20 pointer-events-none"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                )}
                <span className={`text-2xl mt-0.5 ${esMax ? 'animate-spin' : ''}`}>{alerta.icono}</span>
                <div className="flex flex-col relative z-10">
                  <span className={`text-xs font-black tracking-tight ${esMax ? 'text-slate-950 text-shadow-sm' : ''}`}>{alerta.mensaje}</span>
                  <span className={`text-[10px] mt-0.5 leading-relaxed font-sans ${esMax ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{alerta.microcopy}</span>
                </div>
                <motion.div className={`absolute bottom-0 left-0 h-0.5 ${esMax ? 'bg-slate-950' : 'bg-emerald-500'}`} initial={{ width: '100%' }} animate={{ width: 0 }} transition={{ duration: 5, ease: 'linear' }} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {state.matches('modoConstruccion') && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] w-[90%] md:w-auto bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-wider text-center shadow-2xl flex items-center justify-between gap-3">
          <span>🚧 Selecciona la ciudad de destino para el puente conector</span>
          <button onClick={() => send({ type: 'CANCELAR_ACCION' })} className="bg-slate-950 text-white px-2 py-0.5 rounded text-[9px]">Cancelar</button>
        </div>
      )}

      {/* PANEL HUD GENERAL */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl w-[calc(100%-2rem)] md:w-85">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Geoducational</h1>
            <p className="text-[9px] text-sky-600 dark:text-emerald-400 font-bold font-mono">Pacto Federal de Conectividad</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={conmutarTema} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 rounded-lg transition"><Sun size={13} /></button>
            <button onClick={() => setIsHudCollapsed(!isHudCollapsed)} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg transition">{isHudCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}</button>
          </div>
        </div>

        {/* CONTENEDOR DE RECURSOS METROPOLITANOS */}
        <div className="mt-3 grid grid-cols-12 gap-2">
          {/* Fondos */}
          <div className="col-span-7 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 shadow-inner">
            <Wallet size={14} className="text-emerald-500" />
            <div className="flex flex-col">
              <span className="text-[7px] uppercase font-bold text-slate-400 font-mono">Presupuesto</span>
              <span className="text-sm font-mono font-black text-slate-800 dark:text-white tracking-tight">{formatearDinero(dinero)}</span>
            </div>
          </div>

          {/* 🔑 CONTADOR EXPLICITO SOLICITADO: Llaves de la Ciudad */}
          <div className="col-span-5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-1.5 shadow-inner">
            <Key size={14} className="text-amber-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[7px] uppercase font-bold text-slate-400 font-mono">Llaves</span>
              <span className="text-sm font-mono font-black text-amber-500 tracking-tight">{llavesDeLaCiudad} disp.</span>
            </div>
          </div>
        </div>

        {/* Botones de foco de cámara satelital */}
        <div className="mt-2 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 justify-around items-center">
          <button onClick={() => setViewFocus('municipio')} className={`w-full py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${currentViewFocus === 'municipio' ? 'bg-white dark:bg-slate-950 text-sky-500 shadow-sm' : 'text-slate-400'}`}><Map size={11} /> Región</button>
          <button onClick={() => setViewFocus('estado')} className={`w-full py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${currentViewFocus === 'estado' ? 'bg-white dark:bg-slate-950 text-emerald-500 shadow-sm' : 'text-slate-400'}`}><Landmark size={11} /> Estado</button>
          <button onClick={() => setViewFocus('pais')} className={`w-full py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition ${currentViewFocus === 'pais' ? 'bg-white dark:bg-slate-950 text-amber-500 shadow-sm' : 'text-slate-400'}`}><Globe size={11} /> País</button>
        </div>

        {!isHudCollapsed && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 max-h-36 overflow-y-auto pr-1">
            {Object.values(municipios).map((m) => {
              // CORRECCIÓN: Eliminamos por completo el residuo '规范Format =' 
            // para devolver el string formateado directamente como último fallback.
            let tagInfo = !m.desbloqueado 
              ? '🔒 Bloqueado' 
              : m.nivelActual >= 10 
                ? '👑 MAX' 
                : m.nivelActual > 0 
                  ? `Lvl ${m.nivelActual}` 
                  : `💸 ${formatearDinero(m.precioBase)}`;
              if (nodoOrigenObra && nodoOrigenObra.id !== m.id && m.desbloqueado) {
                const dist = calcularDistanciaKm(nodoOrigenObra.coordenadas, m.coordenadas);
                tagInfo = `📏 ${dist.toFixed(0)}km ➜ ${formatearDinero((300 + dist * 75) * 1000000)}`;
              }
              return (
                <div key={m.id} onClick={() => handleNodeClickOnMap(m.id)} className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg border text-[11px] font-bold ${!m.desbloqueado ? 'opacity-30 bg-slate-100 dark:bg-slate-950/20' : state.context.selectedNodeId === m.id ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-700 text-amber-600' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'}`}>
                  <span>{m.desbloqueado ? (m.nivelActual >= 10 ? '👑' : m.nivelActual > 0 ? '🟩' : '⚪') : '⬛'} {m.nombre}</span>
                  <span className={`font-mono text-[9px] ${m.nivelActual >= 10 ? 'text-amber-500 font-black' : 'opacity-75'}`}>{m.nivelActual >= 10 ? '🏆 MAX' : tagInfo}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="w-full h-full" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('leaflet-container') && !state.matches('modoConstruccion')) send({ type: 'CLOSE_PANEL' }); }}>
        <GameMap selectedNodeId={state.context.selectedNodeId} selectedRoadId={state.context.selectedRoadId} onNodeClick={(id) => handleNodeClickOnMap(id)} onRoadClick={(id) => send({ type: 'SELECT_ROAD', id })} modoConstruccionActivo={state.matches('modoConstruccion')} />
      </div>

      <NodeModal nodeId={state.context.selectedNodeId} onClose={() => send({ type: 'CLOSE_PANEL' })} onBuildBridgeInit={() => send({ type: 'INICIAR_CONEXION' })} />
      <RoadModal roadId={state.context.selectedRoadId} onClose={() => send({ type: 'CLOSE_PANEL' })} />
      <QuizCard />
      <AlertasContainer />
    </main>
  );
}