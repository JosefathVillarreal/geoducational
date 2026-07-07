'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useMachine } from '@xstate/react';
import { gameMachine } from './machines/gameMachine';
import { useGameStore, calcularDistanciaKm } from './store/useGameStore';
import NodeModal from './components/NodeModal';
import RoadModal from './components/RoadModal';
import { Sun, Moon } from 'lucide-react';

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

  const [state, send] = useMachine(gameMachine);

  // Vincular el botón modal con el estado de construcción de XState de manera segura
  useEffect(() => {
    (window as any).dispararModoConstruccion = () => send({ type: 'INICIAR_CONEXION' });
    return () => { delete (window as any).dispararModoConstruccion; };
  }, [send]);

  // Game Loop de Ingresos Pasivos
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

  // UX Avanzada: Obtener información del nodo de origen si estamos construyendo
  const nodoOrigenObra = state.matches('modoConstruccion') && state.context.selectedNodeId
    ? municipios[state.context.selectedNodeId]
    : null;

  return (
    <main className="relative w-full h-screen select-none overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* Alerta flotante superior */}
      {state.matches('modoConstruccion') && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[2000] bg-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-full text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3">
          <span>🚧 Modo Obras Públicas: Elige el municipio de destino</span>
          <button onClick={() => send({ type: 'CANCELAR_ACCION' })} className="bg-slate-950 text-white px-3 py-1 rounded-lg text-[10px]">Cancelar</button>
        </div>
      )}

      {/* PANEL HUD */}
      <div className="absolute top-6 left-6 z-[1000] bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-2xl w-80 transition-colors duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Geoducational</h1>
            <p className="text-[10px] text-sky-600 dark:text-emerald-400 font-bold font-mono">Región: Nuevo León, MX</p>
          </div>
          <button
            onClick={conmutarTema}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 rounded-xl transition shadow-sm active:scale-90"
          >
            {tema === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        <div className="mt-4 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[9px] block uppercase font-bold tracking-wider text-slate-400 font-mono">Presupuesto Federal</span>
          <span className="text-2xl font-mono font-black tracking-tight text-slate-800 dark:text-white">
            ${dinero.toLocaleString('es-MX')}
          </span>
        </div>

        {/* LISTA DE MUNICIPIOS CON PRESTACIONES DE CÁLCULO EN TIEMPO REAL */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {Object.values(municipios).map((m) => {
            let subtituloPrecio = `Precio: $${m.precioBase}`;
            
            // Si el modo de obras está encendido, calculamos dinámicamente la distancia y el costo vial
            if (nodoOrigenObra && nodoOrigenObra.id !== m.id) {
              const dist = calcularDistanciaKm(nodoOrigenObra.coordenadas, m.coordenadas);
              const costoEstimado = Math.floor(300 + (dist * 65));
              subtituloPrecio = `📏 ${dist.toFixed(1)} km ➜ $${costoEstimado}`;
            } else if (m.nivelActual > 0) {
              subtituloPrecio = `Lvl Comercial ${m.nivelActual}`;
            }

            return (
              <div 
                key={m.id} 
                onClick={() => handleNodeClickOnMap(m.id)}
                className={`flex justify-between items-center cursor-pointer p-2 rounded-xl border transition text-xs font-bold ${
                  state.context.selectedNodeId === m.id 
                    ? 'bg-sky-50 border-sky-300 dark:bg-slate-800 dark:border-slate-700 text-sky-600 dark:text-white' 
                    : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <span>{m.nivelActual > 0 ? '🟩' : '⬛'} {m.nombre}</span>
                <span className={`font-mono text-[10px] ${nodoOrigenObra && nodoOrigenObra.id !== m.id ? 'text-amber-500 font-bold' : 'opacity-70'}`}>
                  {subtituloPrecio}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENEDOR DEL MAPA CONTROLADO TOTALMENTE POR REACT PROPS */}
      <div className="w-full h-full" onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('leaflet-container') && !state.matches('modoConstruccion')) {
          send({ type: 'CLOSE_PANEL' });
        }
      }}>
       
      <GameMap 
        selectedRoadId={state.context.selectedRoadId}
        onNodeClick={(id) => handleNodeClickOnMap(id)}
        onRoadClick={(id) => send({ type: 'SELECT_ROAD', id })}
        modoConstruccionActivo={state.matches('modoConstruccion')} // 👈 Nueva propiedad reactiva inyectada
      />
      </div>

      {/* VENTANAS MODALES */}
      <NodeModal nodeId={state.context.selectedNodeId} onClose={() => send({ type: 'CLOSE_PANEL' })} />
      <RoadModal roadId={state.context.selectedRoadId} onClose={() => send({ type: 'CLOSE_PANEL' })} />
    </main>
  );
}