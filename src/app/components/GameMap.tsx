'use client';

import { Fragment, useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import { useGameStore } from '../store/useGameStore';
import L from 'leaflet';

interface GameMapProps {
  selectedRoadId: string | null;
  onNodeClick: (id: string) => void;
  onRoadClick: (id: string) => void;
  modoConstruccionActivo: boolean;
}

const POSICION_CENTRAL_NL: [number, number] = [25.6866, -100.3161];

// Función para calcular el desfase de las autopistas dobles paralelas
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

// 🌐 SUB-COMPONENTE TÁCTICO: Captura gestos de arrastre del dedo sobre el canvas
function ControladorGestoTactil({ 
  onDragUpdate, 
  onDragEnd,
  nodoOrigenId 
}: { 
  onDragUpdate: (latlng: [number, number] | null) => void;
  onDragEnd: (latlng: [number, number]) => void;
  nodoOrigenId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!nodoOrigenId) return;

    // ⛔ Congelar el paneo del mapa para que el dedo dibuje el puente y no mueva la pantalla
    map.dragging.disable();
    map.touchZoom.disable();

    const handlePointerMove = (e: PointerEvent) => {
      // Convertir píxeles de la pantalla del celular a coordenadas satelitales (Lat, Lon)
      const puntoContenedor = map.mouseEventToContainerPoint(e);
      const latlng = map.containerPointToLatLng(puntoContenedor);
      onDragUpdate([latlng.lat, latlng.lng]);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const puntoContenedor = map.mouseEventToContainerPoint(e);
      const latlng = map.containerPointToLatLng(puntoContenedor);
      
      // Restaurar controles de navegación del mapa inmediatamente
      map.dragging.enable();
      map.touchZoom.enable();
      
      onDragEnd([latlng.lat, latlng.lng]);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      map.dragging.enable();
      map.touchZoom.enable();
    };
  }, [nodoOrigenId, map, onDragUpdate, onDragEnd]);

  return null;
}

export default function GameMap({ selectedRoadId, onNodeClick, onRoadClick, modoConstruccionActivo }: GameMapProps) {
  const municipios = useGameStore((state) => state.municipios);
  const conexiones = useGameStore((state) => state.conexiones);
  const tema = useGameStore((state) => state.tema);
  const intentarConectarNodos = useGameStore((state) => state.intentarConectarNodos);

  // Estados locales para controlar el puente dinámico que sigue al dedo
  const [nodoOrigenArrastre, setNodoOrigenArrastre] = useState<string | null>(null);
  const [coordenadasDedo, setCoordenadasDedo] = useState<[number, number] | null>(null);

  const tileUrl = tema === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  // Procesar el término del arrastre táctil
  const evaluarLiberacionDedo = (latlngFinal: [number, number]) => {
    if (!nodoOrigenArrastre) return;

    // Buscar si el dedo se soltó encima de algún municipio disponible (umbral de colisión de 3.5 km)
    const radioColisionGrados = 0.025; 
    const municipioDestino = Object.values(municipios).find((m) => {
      if (m.id === nodoOrigenArrastre) return false;
      const difLat = Math.abs(m.coordenadas[0] - latlngFinal[0]);
      const difLon = Math.abs(m.coordenadas[1] - latlngFinal[1]);
      return difLat < radioColisionGrados && difLon < radioColisionGrados;
    });

    if (municipioDestino) {
      const transaccion = intentarConectarNodos(nodoOrigenArrastre, municipioDestino.id);
      if (!transaccion.exito) {
        alert(transaccion.mensaje);
      }
    }

    // Resetear hilos de previsualización
    setNodoOrigenArrastre(null);
    setCoordenadasDedo(null);
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={POSICION_CENTRAL_NL} zoom={11} minZoom={9} maxZoom={15} className="w-full h-full" zoomControl={false}>
        <TileLayer url={tileUrl} attribution="&copy; CARTO" />

        {/* 🛠️ ACTIVADOR GESTUAL: Solo se enciende si el usuario inició el arrastre */}
        {nodoOrigenArrastre && (
          <ControladorGestoTactil 
            nodoOrigenId={nodoOrigenArrastre} 
            onDragUpdate={setCoordenadasDedo} 
            onDragEnd={evaluarLiberacionDedo} 
          />
        )}

        {/* 🏎️ VECTOR PROTOTIPO SEGUIDOR DE DEDO (Puente en Construcción Activo) */}
        {nodoOrigenArrastre && coordenadasDedo && municipios[nodoOrigenArrastre] && (
          <Polyline
            positions={[municipios[nodoOrigenArrastre]!.coordenadas, coordenadasDedo]}
            pathOptions={{
              color: '#f59e0b', // Amber 500 Táctico de Obras Públicas
              weight: 4,
              dashArray: '8, 8',
              className: 'animate-pulse'
            }}
          />
        )}

        {/* ================= CARRETERAS DOBLE VÍA INSTALADAS ================= */}
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

        {/* ================= NODOS MUNICIPALES CON CAPTURA POINTER DOWN ================= */}
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
                // Click estándar para computadoras o toques rápidos
                click: (e) => {
                  L.DomEvent.stopPropagation(e);
                  onNodeClick(municipio.id);
                },
                // 📱 GESTO PARA CELULAR: Al poner el dedo encima, se abre el trazador automático si ya está comprado
                mousedown: (e) => {
                  if (estaComprado) {
                    L.DomEvent.stopPropagation(e);
                    setNodoOrigenArrastre(municipio.id);
                  }
                }
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