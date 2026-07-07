'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { useGameStore, calcularDistanciaKm } from './store/useGameStore';
import NodeModal from './components/NodeModal';
import RoadModal from './components/RoadModal';
import { Sun, Moon, ChevronDown, ChevronUp, Wallet } from 'lucide-react';

const GameMap = dynamic(() => import('./components/GameMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-r-2 border-emerald-500 mb-4"></div>
      <p className="text-xs font-mono tracking-widest text-slate-400 uppercase">Sincronizando Cartografía Satelital...</p>
    </div>
  ),
});

export default function Home() {
  const dinero = useGameStore((state) => state.dinero);
  const municipios = useGameStore((state) => state.municipios);
  const tema = useGameStore((state) => state.tema);
  const conmutarTema = useGameStore((state) => state.conmutarTema);
  const agregarDinero = useGameStore((state) => state.agregarDinero);
  const intentarConectarNodos = useGameStore((state) => state.intentarConectarNodos);

  // 📱 Estado local para colapsar u ocultar el HUD de información general
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  const [state, send] = useMachine(gameMachine);

  useEffect(() => {
    (window as any).dispararModoConstruccion = () => send({ type: 'INICIAR_CONEXION' });
    return () => { delete (window as any).dispararModoConstruccion; };
  }, [send]);

  // Loop pasivo económico
  useEffect(() => {
    const loopEconomico = setInterval(() => {
      let ingresos = 0;
      Object.values(municipios).forEach((m) => {
        if (m.nivelActual > 0) ingresos += m.nivelActual * 12;
      });
      if (ingresos > 0) agregarDinero(ingresos);
    }, 1000);
    return () => clearInterval(loopEconomico);
  }, [municipios, agregarDinero]);

  // Manejador reactivo de clics entre nodos de Leaflet
  const handleNodeClickOnMap = (id: string) => {
    if (state.matches('modoConstruccion')) {
      const nodoOrigenId = state.context.selectedNodeId;
      if (nodoOrigenId) {
        const resultado = intentarConectarNodos(nodoOrigenId, id);
        alert(resultado.mensaje);
      }
      send({ type: 'SELECT_NODE', id });
    } else {
      send({ type: 'SELECT_NODE', id });
    }
  };

  const nodoOrigenObra = state.matches('modoConstruccion') && state.context.selectedNodeId
    ? municipios[state.context.selectedNodeId]
    : null;

  return (
    <main className="relative w-full h-screen select-none overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      
      {state.matches('modoConstruccion') && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[2000] w-[90%] md:w-auto bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-wider text-center shadow-2xl flex items-center justify-between gap-3">
          <span>🚧 Elige el nodo destino para construir el puente</span>
          <button onClick={() => send({ type: 'CANCELAR_ACCION' })} className="bg-slate-950 text-white px-2 py-1 rounded-md text-[9px]">X</button>
        </div>
      )}

      {/* PANEL HUD INTELIGENTE COLAPSABLE */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl w-[calc(100%-2rem)] md:w-80 transition-all duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Geoducational</h1>
            <p className="text-[9px] text-sky-600 dark:text-emerald-400 font-bold font-mono">Nuevo León, MX</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={conmutarTema}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 rounded-lg transition"
            >
              {tema === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            {/* Botón para colapsar panel */}
            <button
              onClick={() => setIsHudCollapsed(!isHudCollapsed)}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg transition"
            >
              {isHudCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          </div>
        </div>

        {/* Sección del Presupuesto (Siempre Visible) */}
        <div className="mt-3 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Wallet size={16} className="text-emerald-500" />
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 font-mono">Fondos Federales</span>
            <span className="text-xl font-mono font-black text-slate-800 dark:text-white">${dinero.toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* Bloque de Municipios: Se desvanece por completo si isHudCollapsed es true */}
        {!isHudCollapsed && (
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1 max-h-40 overflow-y-auto pr-1">
            {Object.values(municipios).map((m) => {
              let subtituloPrecio = `Precio: $${m.precioBase}`;
              if (nodoOrigenObra && nodoOrigenObra.id !== m.id) {
                const dist = calcularDistanciaKm(nodoOrigenObra.coordenadas, m.coordenadas);
                subtituloPrecio = `📏 ${dist.toFixed(1)} km ➜ $${Math.floor(300 + (dist * 65))}`;
              } else if (m.nivelActual > 0) {
                subtituloPrecio = `Lvl ${m.nivelActual}`;
              }

              return (
                <div 
                  key={m.id} 
                  onClick={() => handleNodeClickOnMap(m.id)}
                  className={`flex justify-between items-center cursor-pointer p-1.5 rounded-lg border text-[11px] font-bold ${
                    state.context.selectedNodeId === m.id 
                      ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700 text-amber-600 dark:text-amber-400' 
                      : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <span>{m.nivelActual > 0 ? '🟩' : '⬛'} {m.nombre}</span>
                  <span className={`font-mono text-[9px] ${nodoOrigenObra && nodoOrigenObra.id !== m.id ? 'text-amber-500 font-bold' : 'opacity-60'}`}>
                    {subtituloPrecio}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MAPA INTERACTIVO */}
      <div className="w-full h-full" onClick={(e) => {
        // Al tocar un área vacía del mapa, limpiamos la selección para ocultar modales
        if ((e.target as HTMLElement).classList.contains('leaflet-container') && !state.matches('modoConstruccion')) {
          send({ type: 'CLOSE_PANEL' });
        }
      }}>
        <GameMap 
          selectedNodeId={state.context.selectedNodeId}
          selectedRoadId={state.context.selectedRoadId}
          onNodeClick={(id) => handleNodeClickOnMap(id)}
          onRoadClick={(id) => send({ type: 'SELECT_ROAD', id })}
          modoConstruccionActivo={state.matches('modoConstruccion')}
        />
      </div>

      {/* VENTANAS MODALES DINÁMICAS (Se destruyen solas por defecto si su ID es null) */}
      <NodeModal nodeId={state.context.selectedNodeId} onClose={() => send({ type: 'CLOSE_PANEL' })} />
      <RoadModal roadId={state.context.selectedRoadId} onClose={() => send({ type: 'CLOSE_PANEL' })} />
    </main>
  );
}