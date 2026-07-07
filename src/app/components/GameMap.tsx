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

// Subcomponente interno para congelar/descongelar el mapa usando el hook de Leaflet
function IntercambiadorBloqueoMapa({ congelar }: { congelar: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (congelar) {
      // 🔒 Bloquear interacciones de movimiento para poder seleccionar el segundo nodo sin fallas
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    } else {
      // 🔓 Liberar mapa cuando el usuario deselecciona o termina la obra
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
    }
  }, [congelar, map]);

  return null;
}

function calcularCoordenadasParalelas(
  p1: [number, number],
  p2: [number, number],
  desfase: number
): [[number, number], [number, number]] {
  const [lat1, lon1] = p1;
  const [lat2, lon2] = p2;
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const longitud = Math.sqrt(dLat * dLat + dLon * dLon);
  if (longitud === 0) return [p1, p2];
  const perpLat = -dLon / longitud;
  const perpLon = dLat / longitud;
  return [
    [lat1 + perpLat * desfase, lon1 + perpLon * desfase],
    [lat2 + perpLat * desfase, lon2 + perpLon * desfase]
  ];
}

export default function GameMap({ 
  selectedNodeId, 
  selectedRoadId, 
  onNodeClick, 
  onRoadClick,
  modoConstruccionActivo 
}: GameMapProps) {
  const municipios = useGameStore((state) => state.municipios);
  const conexiones = useGameStore((state) => state.conexiones);
  const tema = useGameStore((state) => state.tema);

  const tileUrl = tema === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // El mapa se congelará si hay un nodo seleccionado O si está el modo construcción encendido
  const mapaDebeCongelarse = selectedNodeId !== null || modoConstruccionActivo;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={POSICION_CENTRAL_NL} zoom={11} minZoom={9} maxZoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />

        {/* 🔑 INYECTOR DE BLOQUEO DE NAVEGACIÓN */}
        <IntercambiadorBloqueoMapa congelar={mapaDebeCongelarse} />

        {/* LINEAS DE CONEXIÓN VIAL */}
        {conexiones.map((conexion) => {
          const origen = municipios[conexion.desde];
          const destino = municipios[conexion.hasta];
          if (!origen || !destino) return null;

          const grosorLinea = 2 + conexion.carriles * 1.5;
          const esSeleccionada = selectedRoadId === conexion.id;

          const coordenadasIda = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, 0.0016);
          const coordenadasVuelta = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, -0.0016);

          return (
            <Fragment key={conexion.id}>
              <Polyline
                positions={coordenadasIda}
                pathOptions={{
                  color: esSeleccionada ? '#10b981' : '#64748b',
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-activa-ida' : ''}`
                }}
                eventHandlers={{
                  click: (e) => { L.DomEvent.stopPropagation(e); onRoadClick(conexion.id); }
                }}
              />
              <Polyline
                positions={coordenadasVuelta}
                pathOptions={{
                  color: esSeleccionada ? '#059669' : '#475569',
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-activa-vuelta' : ''}`
                }}
                eventHandlers={{
                  click: (e) => { L.DomEvent.stopPropagation(e); onRoadClick(conexion.id); }
                }}
              />
            </Fragment>
          );
        })}

        {/* NODOS MUNICIPALES CON SISTEMA DE COLOR DE 3 ESTADOS */}
        {Object.values(municipios).map((municipio) => {
          const estaComprado = municipio.nivelActual > 0;
          const esSeleccionado = selectedNodeId === municipio.id;
          
          const radioProgreso = estaComprado ? 9 + (municipio.nivelActual * 2.5) : 8;
          
          // 🎨 REGLAS CROMÁTICAS ESTRICTAS SOLICITADAS:
          let colorBorde = '#64748b'; // Estado 1: Bloqueado (Gris Slate)
          let colorRelleno = tema === 'dark' ? '#1e293b' : '#cbd5e1';

          if (estaComprado) {
            colorBorde = '#10b981'; // Estado 2: Adquirido (Verde Esmeralda)
            colorRelleno = '#34d399';
          }

          if (esSeleccionado) {
            colorBorde = '#f59e0b'; // Estado 3: Seleccionado (Ámbar Neón)
            colorRelleno = '#fbbf24';
          }

          return (
            <CircleMarker
              key={municipio.id}
              center={municipio.coordenadas}
              radius={radioProgreso}
              pathOptions={{
                color: colorBorde,
                fillColor: colorRelleno,
                fillOpacity: esSeleccionado || estaComprado ? 0.95 : 0.6,
                weight: esSeleccionado ? 4 : (estaComprado ? 3 : 1.5),
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  onNodeClick(municipio.id); // Triggers puros de React, cero window events
                }
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="p-0.5 font-sans font-bold text-xs">
                  {municipio.nombre} {esSeleccionado ? '🔸' : (estaComprado ? '🟩' : '🔒')}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}