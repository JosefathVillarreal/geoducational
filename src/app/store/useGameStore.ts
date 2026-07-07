import { create } from 'zustand';

export interface Municipio {
  id: string;
  nombre: string;
  poblacion: number;
  coordenadas: [number, number];
  nivelActual: number;
  precioBase: number;
  datosCuriosos: string[];
  desbloqueado: boolean;
}

export interface Conexion {
  id: string;
  desde: string;
  hasta: string;
  carriles: number;
  costoConstruccion: number;
}

export interface GameAlert {
  id: string;
  tipo: 'success' | 'build' | 'unlock';
  icono: string;
  mensaje: string;
  microcopy: string;
}

export interface QuizQuestion {
  pregunta: string;
  opciones: string[];
  indexCorrecto: number;
  recompensaEstimada: number;
}

interface GameState {
  dinero: number;
  tema: 'light' | 'dark';
  tokensDesbloqueo: number;
  currentViewFocus: 'municipio' | 'estado' | 'pais';
  municipios: Record<string, Municipio>;
  conexiones: Conexion[];
  alertas: GameAlert[];
  conmutarTema: () => void;
  setViewFocus: (focus: 'municipio' | 'estado' | 'pais') => void;
  agregarDinero: (cantidad: number) => void;
  subirNivelNodo: (id: string) => void;
  intentarConectarNodos: (desdeId: string, hastaId: string) => void;
  intentarDesbloquearNodo: (id: string) => void;
  mejorarCarretera: (id: string) => void;
  removerAlerta: (id: string) => void;
}

// Agrega esto a la interfaz 'GameState'
interface GameState {
  // ... propiedades anteriores
  quizActivo: QuizQuestion | null;
  lanzarQuizPregunta: () => void;
  responderQuizPregunta: (indexSeleccionado: number) => { exito: boolean; mensaje: string; microcopy: string };
  cerrarQuiz: () => void;
}

// 🧮 FUNCIÓN DE ÉLITE: Formatea números grandes limitándolos estrictamente a un formato legible de 4 dígitos
export const formatearDinero = (val: number): string => {
  if (val >= 1_000_000_000) {
    return `$${(val / 1_000_000_000).toFixed(3).substring(0, 5)}B`;
  }
  if (val >= 1_000_000) {
    return `$${(val / 1_000_000).toFixed(3).substring(0, 5)}M`;
  }
  if (val >= 1_000) {
    return `$${(val / 1_000).toFixed(0)}K`;
  }
  return `$${val}`;
};

export const calcularDistanciaKm = (p1: [number, number], p2: [number, number]): number => {
  const R = 6371;
  const dLat = ((p2[0] - p1[0]) * Math.PI) / 180;
  const dLon = ((p2[1] - p1[1]) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((p1[0] * Math.PI) / 180) * Math.cos((p2[0] * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const useGameStore = create<GameState>()((set, get) => ({
  dinero: 5000000000, 
  tema: 'dark',
  tokensDesbloqueo: 0,
  currentViewFocus: 'municipio',
   quizActivo: null,
  municipios: {
    'nl_mty': { id: 'nl_mty', nombre: 'Monterrey', poblacion: 1142994, coordenadas: [25.6866, -100.3161], nivelActual: 1, precioBase: 400000000, datosCuriosos: ["🏛️ Sultana del Norte.", "⛰️ Cerro de la Silla.", "🏭 Capital industrial.", "🏙️ Torre Obispado."], desbloqueado: true },
    'nl_spgg': { id: 'nl_spgg', nombre: 'San Pedro Garza García', poblacion: 132169, coordenadas: [25.6575, -100.4017], nivelActual: 0, precioBase: 1200000000, datosCuriosos: ["💰 Mayor ingreso per cápita.", "🌲 Parque Chipinque."], desbloqueado: true },
    'nl_gpe': { id: 'nl_gpe', nombre: 'Guadalupe', poblacion: 643143, coordenadas: [25.6798, -100.2596], nivelActual: 0, precioBase: 350000000, datosCuriosos: ["⚽ Sede Estadio BBVA.", "🦜 Río La Silla.", "🤠 Misión Tlaxcalteca."], desbloqueado: true },
    'nl_sn': { id: 'nl_sn', nombre: 'San Nicolás', poblacion: 412199, coordenadas: [25.7506, -100.2954], nivelActual: 0, precioBase: 500000000, datosCuriosos: ["🎓 Campus UANL.", "🐯 El Volcán.", "🥇 Desarrollo Humano."], desbloqueado: false },
    'nl_apo': { id: 'nl_apo', nombre: 'Apodaca', poblacion: 656464, coordenadas: [25.7809, -100.1887], nivelActual: 0, precioBase: 650000000, datosCuriosos: ["✈️ Aeropuertos internacionales.", "🔌 Manufactura eléctrica.", "🧀 Quesos y carnes."], desbloqueado: false },
    'nl_esc': { id: 'nl_esc', nombre: 'General Escobedo', poblacion: 483015, coordenadas: [25.8078, -100.3223], nivelActual: 0, precioBase: 450000000, datosCuriosos: ["🚛 Hub logístico fronterizo.", "🛡️ Gral. Mariano Escobedo.", "🏗️ Crecimiento masivo."], desbloqueado: false },
    'nl_sc': { id: 'nl_sc', nombre: 'Santa Catarina', poblacion: 306322, coordenadas: [25.6749, -100.4633], nivelActual: 0, precioBase: 700000000, datosCuriosos: ["🌵 La Huasteca.", "🚗 Electromovilidad.", "💧 Antigua parada de arrieros."], desbloqueado: false },
    'nl_stg': { id: 'nl_stg', nombre: 'Santiago', poblacion: 46784, coordenadas: [25.4239, -100.1506], nivelActual: 0, precioBase: 850000000, datosCuriosos: ["✨ Pueblo Mágico.", "🌊 Presa de la Boca.", "🥾 Cascada Cola de Caballo."], desbloqueado: false },
    'nl_lin': { id: 'nl_lin', nombre: 'Linares', poblacion: 84666, coordenadas: [24.8583, -99.5656], nivelActual: 0, precioBase: 600000000, datosCuriosos: ["🍬 Glorias de Linares.", "🎻 Tambora y clarinete.", "🍊 Producción citrícola."], desbloqueado: false }
  },
  conexiones: [],
  alertas: [],

  conmutarTema: () => set((state) => {
    const nuevoTema = state.tema === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', nuevoTema === 'dark');
    return { tema: nuevoTema };
  }),

  setViewFocus: (focus) => set({ currentViewFocus: focus }),
  agregarDinero: (cantidad) => set((state) => ({ dinero: state.dinero + cantidad })),
  removerAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),

  subirNivelNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.nivelActual >= 10 || !nodo.desbloqueado) return state;

    const costo = nodo.nivelActual === 0 ? nodo.precioBase : Math.floor(nodo.precioBase * Math.pow(1.9, nodo.nivelActual));
    if (state.dinero < costo) return state;

    const nuevoNivel = nodo.nivelActual + 1;
    let tokensExtra = state.tokensDesbloqueo;
    let nuevasAlertas = [...state.alertas];

    if (nuevoNivel === 10) {
      tokensExtra += 1;
      nuevasAlertas.push({
        id: Math.random().toString(),
        tipo: 'unlock',
        icono: '👑',
        mensaje: `¡${nodo.nombre} al Máximo Potencial!`,
        microcopy: `Has ganado 1 Token de Expansión Territorial Federal.`
      });
    } else {
      nuevasAlertas.push({
        id: Math.random().toString(),
        tipo: 'success',
        icono: '📈',
        mensaje: `${nodo.nombre} Ascendió`,
        microcopy: `Ahora es una ciudad más grande con más habitantes. ¡PIB en aumento!`
      });
    }

    return {
      dinero: state.dinero - costo,
      tokensDesbloqueo: tokensExtra,
      alertas: nuevasAlertas,
      municipios: { ...state.municipios, [id]: { ...nodo, nivelActual: nuevoNivel } }
    };
  }),

  intentarConectarNodos: (desdeId, hastaId) => {
    const state = get();
    const origen = state.municipios[desdeId];
    const destino = state.municipios[hastaId];
    if (!origen || !destino || !origen.desbloqueado || !destino.desbloqueado) return;

    const dist = calcularDistanciaKm(origen.coordenadas, destino.coordenadas);
    const costoCarretera = Math.floor((300 + (dist * 75)) * 1000000);

    if (state.dinero < costoCarretera) return;

    const nuevaConexion: Conexion = { 
      id: `${desdeId}-${hastaId}`, 
      desde: desdeId, 
      hasta: hastaId, 
      carriles: 1,
      costoConstruccion: costoCarretera
    };
    
    set((state) => ({
      dinero: state.dinero - costoCarretera,
      conexiones: [...state.conexiones, nuevaConexion],
      alertas: [...state.alertas, {
        id: Math.random().toString(),
        tipo: 'build',
        icono: '🚀',
        mensaje: `Eje Vial Conectado`,
        microcopy: `Red vial expandida entre ${origen.nombre} y ${destino.nombre} (${formatearDinero(costoCarretera)}).`
      }]
    }));
  },

  intentarDesbloquearNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.desbloqueado || state.tokensDesbloqueo <= 0) return state;

    return {
      tokensDesbloqueo: state.tokensDesbloqueo - 1,
      alertas: [...state.alertas, {
        id: Math.random().toString(),
        tipo: 'unlock',
        icono: '🗺️',
        mensaje: `${nodo.nombre} Habilitado`,
        microcopy: "La soberanía comercial se expande a un nuevo municipio de Nuevo León."
      }],
      municipios: { ...state.municipios, [id]: { ...nodo, desbloqueado: true, nivelActual: 1 } }
    };
  }),

  mejorarCarretera: (id) => set((state) => {
    const idx = state.conexiones.findIndex(c => c.id === id);
    if (idx === -1) return state;
    const conexion = state.conexiones[idx];
    const costo = conexion.carriles * 200000000;
    if (state.dinero < costo || conexion.carriles >= 6) return state;

    const copias = [...state.conexiones];
    copias[idx] = { ...conexion, carriles: conexion.carriles + 1 };
    return {
      dinero: state.dinero - costo,
      conexiones: copias,
      alertas: [...state.alertas, {
        id: Math.random().toString(),
        tipo: 'build',
        icono: '🛣️',
        mensaje: `Infraestructura Ampliada`,
        microcopy: `Autopista mejorada a ${conexion.carriles + 1} carriles de alta velocidad.`
      }]
    };
  }),

 
  lanzarQuizPregunta: () => {
    const state = get();
    // 🔍 Filtrar solo municipios que el jugador ya haya adquirido para evaluar lo aprendido
    const adquiridos = Object.values(state.municipios).filter(m => m.nivelActual > 0);
    if (adquiridos.length === 0) return;

    // Seleccionar ciudad, dato curioso y generar distractores
    const ciudadRandom = adquiridos[Math.floor(Math.random() * adquiridos.length)]!;
    const datoRandom = ciudadRandom.datosCuriosos[Math.floor(Math.random() * ciudadRandom.datosCuriosos.length)]!;

    // Encontrar la ciudad bloqueada más barata para calcular el 50% de recompensa solicitado
    const proximasCiudades = Object.values(state.municipios).filter(m => !m.desbloqueado);
    const ciudadReferencia = proximasCiudades.length > 0 
      ? proximasCiudades.reduce((prev, curr) => prev.precioBase < curr.precioBase ? prev : curr)
      : { precioBase: 50000000000 }; // Fallback de $500M si ya conquistó todo

    const recompensaCalculada = Math.floor(ciudadReferencia.precioBase * 2.9);

    // Muestreo de distractores usando nombres de otras ciudades del mapa mental
    const distractores = Object.values(state.municipios)
      .filter(m => m.id !== ciudadRandom.id)
      .map(m => m.nombre);
    
    const opcionA = distractores[0] || "San Nicolás";
    const opcionB = distractores[1] || "Apodaca";

    // Armar opciones mezcladas
    const opcionesMezcladas = [ciudadRandom.nombre, opcionA, opcionB].sort(() => Math.random() - 0.5);
    const indexCorrecto = opcionesMezcladas.indexOf(ciudadRandom.nombre);

    set({
      quizActivo: {
        pregunta: `¿A qué municipio de Nuevo León pertenece el siguiente dato histórico o geográfico?\n\n"${datoRandom}"`,
        opciones: opcionesMezcladas,
        indexCorrecto,
        recompensaEstimada: recompensaCalculada
      }
    });
  },

  responderQuizPregunta: (indexSeleccionado) => {
    const state = get();
    const quiz = state.quizActivo;
    if (!quiz) return { exito: false, mensaje: "", microcopy: "" };

    const esCorrecto = indexSeleccionado === quiz.indexCorrecto;
    let nuevasAlertas = [...state.alertas];

    if (esCorrecto) {
      // 🎉 Acreditación macroeconómica de fondos
      set((state) => ({ dinero: state.dinero + quiz.recompensaEstimada }));
      
      nuevasAlertas.push({
        id: Math.random().toString(),
        tipo: 'success',
        icono: '🧠',
        mensaje: 'Acreditación por Rendimiento Intelectual',
        microcopy: `¡Felicidades! Has respondido correctamente. Fondos federales transferidos.`
      });

      return {
        exito: true,
        mensaje: "¡Excelente decisión de gabinete!",
        microcopy: `Tu conocimiento ha inyectado ${formatearDinero(quiz.recompensaEstimada)} a las arcas del estado.`
      };
    } else {
      nuevasAlertas.push({
        id: Math.random().toString(),
        tipo: 'unlock',
        icono: '❌',
        mensaje: 'Dictamen de Auditoría Vial Reprobado',
        microcopy: 'La respuesta no coincide con los registros cartográficos oficiales.'
      });

      return {
        exito: false,
        mensaje: "Respuesta Incorrecta",
        microcopy: "Los asesores financieros han congelado el estímulo esta vez. ¡Sigue repasando las trivias!"
      };
    }
  },

  cerrarQuiz: () => set({ quizActivo: null })
}));
