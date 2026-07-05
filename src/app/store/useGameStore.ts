import { create } from 'zustand';

export interface Municipio {
  id: string;
  nombre: string;
  poblacion: number;
  coordenadas: [number, number];
  nivelActual: number;
  precioBase: number;
  datosCuriosos: string[];
}

export interface Conexion {
  id: string;
  desde: string;
  hasta: string;
  carriles: number;
  tipo: 'simple' | 'doble';
  costoConstruccion: number;
}

interface GameState {
  dinero: number;
  tema: 'light' | 'dark';
  municipios: Record<string, Municipio>;
  conexiones: Conexion[];
  conmutarTema: () => void;
  agregarDinero: (cantidad: number) => void;
  subirNivelNodo: (id: string) => void;
  intentarConectarNodos: (desdeId: string, hastaId: string) => { exito: boolean; mensaje: string };
  mejorarCarretera: (id: string) => void;
}

// 📐 FUNCIÓN MATEMÁTICA: Haversine para calcular distancia real en Kilómetros
export const calcularDistanciaKm = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371; // Radio de la Tierra en Km
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1[0] * Math.PI) / 180) *
      Math.cos((p2[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distancia exacta devuelta en Kilómetros
};

export const useGameStore = create<GameState>()((set, get) => ({
  dinero: 12000, // Presupuesto inicial generoso para probar la red de carreteras a larga distancia
  tema: 'dark',
  municipios: {
    'nl_mty': { id: 'nl_mty', nombre: 'Monterrey', poblacion: 1142994, coordenadas: [25.6866, -100.3161], nivelActual: 1, precioBase: 500, datosCuriosos: ["🏛️ Sultana del Norte.", "⛰️ Cerro de la Silla.", "🏭 Capital industrial."] },
    'nl_spgg': { id: 'nl_spgg', nombre: 'San Pedro Garza García', poblacion: 132169, coordenadas: [25.6575, -100.4017], nivelActual: 0, precioBase: 2000, datosCuriosos: ["💰 Mayor ingreso per cápita.", "🌲 Parque Chipinque.", "🏙️ Torre Obispado."] },
    'nl_gpe': { id: 'nl_gpe', nombre: 'Guadalupe', poblacion: 643143, coordenadas: [25.6798, -100.2596], nivelActual: 0, precioBase: 600, datosCuriosos: ["⚽ Sede Estadio BBVA.", "🦜 Río La Silla.", "🤠 Misión Tlaxcalteca."] },
    'nl_sn': { id: 'nl_sn', nombre: 'San Nicolás', poblacion: 412199, coordenadas: [25.7506, -100.2954], nivelActual: 0, precioBase: 800, datosCuriosos: ["🎓 Campus UANL.", "🐯 El Volcán.", "🥇 Desarrollo Humano."] },
    'nl_apo': { id: 'nl_apo', nombre: 'Apodaca', poblacion: 656464, coordenadas: [25.7809, -100.1887], nivelActual: 0, precioBase: 900, datosCuriosos: ["✈️ Aeropuertos internacionales.", "🔌 Manufactura eléctrica.", "🧀 Quesos y carnes."] },
    'nl_esc': { id: 'nl_esc', nombre: 'Escobedo', poblacion: 483015, coordenadas: [25.8078, -100.3223], nivelActual: 0, precioBase: 700, datosCuriosos: ["🚛 Hub logístico fronterizo.", "🛡️ Gral. Mariano Escobedo.", "🏗️ Crecimiento masivo."] },
    'nl_sc': { id: 'nl_sc', nombre: 'Santa Catarina', poblacion: 306322, coordenadas: [25.6749, -100.4633], nivelActual: 0, precioBase: 1100, datosCuriosos: ["🌵 La Huasteca.", "🚗 Electromovilidad.", "💧 Antigua parada de arrieros."] },
    'nl_stg': { id: 'nl_stg', nombre: 'Santiago', poblacion: 46784, coordenadas: [25.4239, -100.1506], nivelActual: 0, precioBase: 1400, datosCuriosos: ["✨ Pueblo Mágico.", "🌊 Presa de la Boca.", "🥾 Cascada Cola de Caballo."] },
    'nl_lin': { id: 'nl_lin', nombre: 'Linares', poblacion: 84666, coordenadas: [24.8583, -99.5656], nivelActual: 0, precioBase: 1000, datosCuriosos: ["🍬 Glorias de Linares.", "🎻 Tambora y clarinete.", "🍊 Producción citrícola."] }
  },
  conexiones: [],

  conmutarTema: () => set((state) => {
    const nuevoTema = state.tema === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nuevoTema === 'dark');
    return { tema: nuevoTema };
  }),

  agregarDinero: (cantidad) => set((state) => ({ dinero: state.dinero + cantidad })),
  
  subirNivelNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.nivelActual >= 10) return state;
    const costo = nodo.nivelActual === 0 ? nodo.precioBase : Math.floor(nodo.precioBase * Math.pow(1.8, nodo.nivelActual));
    if (state.dinero < costo) return state;

    return {
      dinero: state.dinero - costo,
      municipios: { ...state.municipios, [id]: { ...nodo, nivelActual: nodo.nivelActual + 1 } }
    };
  }),

  intentarConectarNodos: (desdeId, hastaId) => {
    const state = get();
    if (desdeId === hastaId) return { exito: false, mensaje: "Imposible trazar vector al mismo nodo." };
    const existe = state.conexiones.some(c => (c.desde === desdeId && c.hasta === hastaId) || (c.desde === hastaId && c.hasta === desdeId));
    if (existe) return { exito: false, mensaje: "Este eje vial de interconexión ya existe." };

    const origen = state.municipios[desdeId];
    const destino = state.municipios[hastaId];
    if (!origen || !destino) return { exito: false, mensaje: "Nodos no válidos." };

    // 💸 PRECIO DINÁMICO POR DISTANCIA: Costo base federal de $300 + $65 por cada Kilómetro real
    const distanciaKm = calcularDistanciaKm(origen.coordenadas, destino.coordenadas);
    const costoCarretera = Math.floor(300 + (distanciaKm * 65));

    if (state.dinero < costoCarretera) {
      return { exito: false, mensaje: `Presupuesto insuficiente. Esta carretera requiere $${costoCarretera} por la distancia (${distanciaKm.toFixed(1)} km).` };
    }

    set((state) => ({
      dinero: state.dinero - costoCarretera,
      conexiones: [...state.conexiones, { id: `${desdeId}-${hastaId}`, desde: desdeId, hasta: hastaId, carriles: 1, tipo: 'doble', costoConstruccion: costoCarretera }]
    }));
    return { exito: true, mensaje: `🚀 Autopista inaugurada. Distancia: ${distanciaKm.toFixed(1)} Km. Costo: $${costoCarretera}` };
  },

  mejorarCarretera: (id) => set((state) => {
    const idx = state.conexiones.findIndex(c => c.id === id);
    if (idx === -1) return state;
    const conexion = state.conexiones[idx];
    if (conexion.carriles >= 6) return state;
    const costo = conexion.carriles * 250;
    if (state.dinero < costo) return state;

    const copias = [...state.conexiones];
    copias[idx] = { ...conexion, carriles: conexion.carriles + 1 };
    return { dinero: state.dinero - costo, conexiones: copias };
  })
}));