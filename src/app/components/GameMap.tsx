'use client';

// 1. 🔑 IMPORTANTE: Importamos Fragment desde React aquí arriba
import { Fragment } from 'react'; 
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import { useGameStore } from '../store/useGameStore';
import L from 'leaflet';

interface GameMapProps {
  selectedRoadId: string | null;
  onNodeClick: (id: string) => void;
  onRoadClick: (id: string) => void;
}

const POSICION_CENTRAL_NL: [number, number] = [25.6866, -100.3161];

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
    [lat2 + perpLon * desfase, lon2 + perpLat * desfase] // Corregido orden de proyección simétrica
  ];
}

export default function GameMap({ selectedRoadId, onNodeClick, onRoadClick }: GameMapProps) {
  const municipios = useGameStore((state) => state.municipios);
  const conexiones = useGameStore((state) => state.conexiones);
  const tema = useGameStore((state) => state.tema);

  const tileUrl = tema === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={POSICION_CENTRAL_NL} zoom={11} minZoom={9} maxZoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />

        {/* ================= CARRETERAS DOBLE VÍA CON PARALELISMO VECTORIAL ================= */}
        {conexiones.map((conexion) => {
          const origen = municipios[conexion.desde];
          const destino = municipios[conexion.hasta];
          if (!origen || !destino) return null;

          const grosorLinea = 2 + conexion.carriles * 1.5;
          const esSeleccionada = selectedRoadId === conexion.id;

          const coordenadasIda = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, 0.0018);
          const coordenadasVuelta = calcularCoordenadasParalelas(origen.coordenadas, destino.coordenadas, -0.0018);

          return (
            // 2. 🎯 CORRECCIÓN: Reemplazamos <g> por <Fragment> para agrupar sin ensuciar el mapa
            <Fragment key={conexion.id}>
              {/* Sentido de Ida (Tráfico hacia adelante) */}
              <Polyline
                positions={coordenadasIda}
                pathOptions={{
                  color: esSeleccionada ? '#10b981' : '#64748b',
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-activa-ida' : ''}`
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    onRoadClick(conexion.id);
                  }
                }}
              />
              {/* Sentido de Vuelta (Tráfico inverso coordinado) */}
              <Polyline
                positions={coordenadasVuelta}
                pathOptions={{
                  color: esSeleccionada ? '#059669' : '#475569',
                  weight: grosorLinea,
                  className: `vector-carretera ${esSeleccionada ? 'carretera-activa-vuelta' : ''}`
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    onRoadClick(conexion.id);
                  }
                }}
              />
            </Fragment>
          );
        })}

        {/* ================= NODOS MUNICIPALES ================= */}
        {Object.values(municipios).map((municipio) => {
          const estaComprado = municipio.nivelActual > 0;
          const radioProgreso = estaComprado ? 9 + (municipio.nivelActual * 2.5) : 8;
          
          const colorBorde = estaComprado ? '#10b981' : '#64748b';
          const colorRelleno = estaComprado ? '#34d399' : (tema === 'dark' ? '#1e293b' : '#cbd5e1');

          return (
            <CircleMarker
              key={municipio.id}
              center={municipio.coordenadas}
              radius={radioProgreso}
              pathOptions={{
                color: colorBorde,
                fillColor: colorRelleno,
                fillOpacity: estaComprado ? 0.9 : 0.6,
                weight: estaComprado ? 3 : 1.5,
              }}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  onNodeClick(municipio.id);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="p-0.5 font-sans font-bold text-xs">
                  {municipio.nombre} {estaComprado ? `(Lvl ${municipio.nivelActual})` : '🔒'}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}