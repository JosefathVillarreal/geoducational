// src/app/components/GameMap.tsx
'use client';

import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useGameStore } from '../store/useGameStore';
import L from 'leaflet';

interface GameMapProps {
  selectedNodeId: string | null;
  selectedRoadId: string | null;
  onNodeClick: (id: string) => void;
  onRoadClick: (id: string) => void;
  modoConstruccionActivo: boolean;
}

const POSICION_CENTRAL_NL: [number, number] = [25.6866, -100.3161];

function ControladorCamaraEnfoque({ focus }: { focus: 'municipio' | 'estado' | 'pais' }) {
  const map = useMap();
  useEffect(() => {
    if (focus === 'municipio') map.setView(POSICION_CENTRAL_NL, 11, { animate: true, duration: 1.2 });
    if (focus === 'estado') map.setView([25.5000, -99.9000], 8.5, { animate: true, duration: 1.2 });
    if (focus === 'pais') map.setView([23.6345, -102.5528], 5, { animate: true, duration: 1.5 });
  }, [focus, map]);
  return null;
}

function IntercambiadorBloqueoMapa({ congelar }: { congelar: boolean }) {
  const map = useMap();
  useEffect(() => {
    const acciones = [map.dragging, map.touchZoom, map.doubleClickZoom, map.scrollWheelZoom];
    acciones.forEach(a => congelar ? a.disable() : a.enable());
  }, [congelar, map]);
  return null;
}

function calcularCoordenadasParalelas(p1: [number, number], p2: [number, number], desfase: number): [[number, number], [number, number]] {
  const [lat1, lon1] = p1; const [lat2, lon2] = p2;
  const dLat = lat2 - lat1; const dLon = lon2 - lon1;
  const len = Math.sqrt(dLat * dLat + dLon * dLon);
  if (len === 0) return [p1, p2];
  return [[lat1 + (-dLon / len) * desfase, lon1 + (dLat / len) * desfase], [lat2 + (-dLon / len) * desfase, lon2 + (dLat / len) * desfase]];
}

export default function GameMap({ selectedNodeId, selectedRoadId, onNodeClick, onRoadClick, modoConstruccionActivo }: GameMapProps) {
  const municipios = useGameStore((state) => state.municipios);
  const conexiones = useGameStore((state) => state.conexiones);
  const tema = useGameStore((state) => state.tema);
  const focus = useGameStore((state) => state.currentViewFocus);

  const tileUrl = tema === 'dark' ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const mapaDebeCongelarse = selectedNodeId !== null || modoConstruccionActivo;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={POSICION_CENTRAL_NL} zoom={8} minZoom={4} maxZoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />

        <IntercambiadorBloqueoMapa congelar={mapaDebeCongelarse} />
        <ControladorCamaraEnfoque focus={focus} />

        {/* 🛣️ CAPA 1: DIBUJAMOS PRIMERO LAS CARRETERAS (Se renderizan al fondo del lienzo SVG) */}
        {conexiones.map((conexion) => {
          const origen = municipios[conexion.desde];
          const destino = municipios[conexion.hasta];
          if (!origen || !destino) return null;

          const grosorLinea = 2.5 + conexion.carriles * 1.5;
          const esSeleccionada = selectedRoadId === conexion.id;

          const coordenadasIda = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, 0.0016);
          const coordenadasVuelta = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, -0.0016);

          return (
            <Fragment key={conexion.id}>
              <Polyline
                positions={coordenadasIda}
                pathOptions={{
                  color: esSeleccionada ? '#f59e0b' : (tema === 'dark' ? '#38bdf8' : '#0284c7'),
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-ida-animada' : ''}`
                } as any}
                eventHandlers={{ 
                  click: (e) => { 
                    L.DomEvent.stopPropagation(e.originalEvent); // Corrección: Detener propagación nativa real
                    onRoadClick(conexion.id); 
                  } 
                }}
              />
              <Polyline
                positions={coordenadasVuelta}
                pathOptions={{
                  color: esSeleccionada ? '#d97706' : (tema === 'dark' ? '#0ea5e9' : '#0369a1'),
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-vuelta-animada' : ''}`
                } as any}
                eventHandlers={{ 
                  click: (e) => { 
                    L.DomEvent.stopPropagation(e.originalEvent); 
                    onRoadClick(conexion.id); 
                  } 
                }}
              />
            </Fragment>
          );
        })}

        {/* 🗺️ CAPA 2: DIBUJAMOS LOS NODOS MUNICIPALES DESPUÉS (Se superponen de forma perfecta sobre las líneas) */}
        {Object.values(municipios).map((municipio) => {
          const estaComprado = municipio.nivelActual > 0;
          const esSeleccionado = selectedNodeId === municipio.id;
          
          // Radio base sólido para asegurar una excelente zona de impacto táctil
          const radioProgreso = estaComprado ? 10 + (municipio.nivelActual * 2.5) : 11;
          
          // Colores de alta presencia para romper definitivamente el camuflaje oscuro
          let colorBorde = tema === 'dark' ? '#94a3b8' : '#64748b'; 
          let colorRelleno = tema === 'dark' ? '#475569' : '#cbd5e1';
          let opacidadRelleno = 0.85;

          if (municipio.desbloqueado && !estaComprado) {
            colorBorde = '#a1a1aa'; 
            colorRelleno = tema === 'dark' ? '#3f3f46' : '#f4f4f5';
            opacidadRelleno = 0.9;
          }

          if (municipio.desbloqueado && estaComprado) {
            colorBorde = '#10b981'; 
            colorRelleno = '#34d399';
            opacidadRelleno = 0.95;
          }

          if (esSeleccionado) {
            colorBorde = '#f59e0b'; 
            colorRelleno = '#fbbf24';
            opacidadRelleno = 1.0;
          }

          return (
            <CircleMarker
              key={municipio.id}
              center={municipio.coordenadas}
              radius={radioProgreso}
              pathOptions={{
                color: colorBorde,
                fillColor: colorRelleno,
                fillOpacity: opacidadRelleno,
                weight: esSeleccionado ? 4 : (estaComprado ? 3 : 2),
                dashArray: !municipio.desbloqueado ? '4, 4' : undefined 
              }}
              eventHandlers={{
                click: (e) => { 
                  L.DomEvent.stopPropagation(e.originalEvent); // Corrección: Detener propagación nativa real
                  onNodeClick(municipio.id); 
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="p-0.5 font-sans font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  {municipio.nombre} {!municipio.desbloqueado ? '🔒' : (esSeleccionado ? '🔸' : (estaComprado ? '🟩' : '⚪'))}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}