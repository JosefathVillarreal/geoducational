'use client';

import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap, Pane } from 'react-leaflet';
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

// 🧭 CONTROLADOR INTELIGENTE DE CÁMARA SATELITAL RESPONSIVA
function ControladorCamaraEnfoque({ focus }: { focus: 'municipio' | 'estado' | 'pais' }) {
  const map = useMap();

  useEffect(() => {
    // Escala de saltos de zoom tácticos según la jerarquía comercial
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
      <MapContainer center={POSICION_CENTRAL_NL} zoom={11} minZoom={4} maxZoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />

        <IntercambiadorBloqueoMapa congelar={mapaDebeCongelarse} />
        <ControladorCamaraEnfoque focus={focus} />

        {/* CARRETERAS CON ANIMACIÓN INVERSA ABSTRACTA DE COCHES */}
        <Pane name="capa-puentes" style={{ zIndex: 450 }}>
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
                    color: esSeleccionada ? '#f59e0b' : '#38bdf8',
                    weight: grosorLinea,
                    className: 'vector-carretera carretera-ida-animada'
                  } as any} // 👈 Añadimos 'as any' al cierre del objeto para que el compilador de Next.js lo acepte sin chistar
                  eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onRoadClick(conexion.id); } }}
                />

                <Polyline
                  positions={coordenadasVuelta}
                  pathOptions={{
                    color: esSeleccionada ? '#d97706' : '#0ea5e9',
                    weight: grosorLinea,
                    className: 'vector-carretera carretera-vuelta-animada'
                  } as any} // 👈 Mismo ajuste aquí
                  eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onRoadClick(conexion.id); } }}
                />
              </Fragment>
            );
          })}
        </Pane>

        {/* Capa Z-Index Superior: Nodos Municipales */}
        <Pane name="capa-nodos" style={{ zIndex: 500 }}>
          {Object.values(municipios).map((municipio) => {
            const estaComprado = municipio.nivelActual > 0;
            const esSeleccionado = selectedNodeId === municipio.id;
            
            const radioProgreso = estaComprado ? 9 + (municipio.nivelActual * 2.5) : 8;
            
            // 🎨 REGLAS CROMÁTICAS OPTIMIZADAS CON NUEVO ESTADO GRIS DE BLOQUEO INTERNO:
            let colorBorde = '#475569'; // Gris oscuro sólido para bloqueados de fábrica
            let colorRelleno = tema === 'dark' ? '#0f172a' : '#94a3b8';

            if (municipio.desbloqueado && !estaComprado) {
              colorBorde = '#64748b'; // Gris claro disponible para compra
              colorRelleno = tema === 'dark' ? '#1e293b' : '#cbd5e1';
            }

            if (municipio.desbloqueado && estaComprado) {
              colorBorde = '#10b981'; // Adquirido (Verde)
              colorRelleno = '#34d399';
            }

            if (esSeleccionado) {
              colorBorde = '#f59e0b'; // Seleccionado Activo (Ámbar)
              colorRelleno = '#fbbf24';
            }

            return (
              <CircleMarker
                key={municipio.id}
                center={municipio.coordenadas}
                radius={radioProgreso}
                pathOptions={{
                  pane: 'capa-nodos',
                  color: colorBorde,
                  fillColor: colorRelleno,
                  fillOpacity: esSeleccionado || estaComprado ? 0.95 : 0.4,
                  weight: esSeleccionado ? 4 : (estaComprado ? 3 : 1.5),
                }}
                eventHandlers={{
                  click: (e) => { L.DomEvent.stopPropagation(e); onNodeClick(municipio.id); }
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                  <div className="p-0.5 font-sans font-bold text-xs">
                    {municipio.nombre} {!municipio.desbloqueado ? '🔒' : (esSeleccionado ? '🔸' : (estaComprado ? '🟩' : '⚪'))}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </Pane>
      </MapContainer>
    </div>
  );
}