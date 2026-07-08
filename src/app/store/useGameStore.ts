// src/app/store/useGameStore.ts
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
  tipo: 'success' | 'build' | 'unlock' | 'max_level';
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
  llavesDeLaCiudad: number; // ✨ SOLUCIÓN: Cambiado de 0 a number para permitir progresión fluida
  
  currentViewFocus: 'municipio' | 'estado' | 'pais';
  municipios: Record<string, Municipio>;
  conexiones: Conexion[];
  alertas: GameAlert[];
  quizActivo: QuizQuestion | null;
  conmutarTema: () => void;
  setViewFocus: (focus: 'municipio' | 'estado' | 'pais') => void;
  agregarDinero: (cantidad: number) => void;
  subirNivelNodo: (id: string) => void;
  intentarConectarNodos: (desdeId: string, hastaId: string) => void;
  intentarDesbloquearNodo: (id: string) => void;
  mejorarCarretera: (id: string) => void;
  removerAlerta: (id: string) => void;
  lanzarQuizPregunta: () => void;
  responderQuizPregunta: (indexSeleccionado: number) => { exito: boolean; mensaje: string; microcopy: string };
  cerrarQuiz: () => void;
  isHudCollapsed: boolean;
  conmutarHud: () => void;
}

export const formatearDinero = (val: number): string => {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(3).substring(0, 5)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(3).substring(0, 5)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
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
  llavesDeLaCiudad: 1, // Otorgamos 1 llave inicial de regalo para expandirse rápido
  currentViewFocus: 'municipio',
  isHudCollapsed: false,
  quizActivo: null,
  municipios: {
    // METROPOLITANOS INICIALES LIBRES
    'nl_mty': { id: 'nl_mty', nombre: 'Monterrey', poblacion: 1142994, coordenadas: [25.6866, -100.3161], nivelActual: 1, precioBase: 400000000, datosCuriosos: ["🏛️ Conocida como la Sultana del Norte.", "⛰️ Resguarda el icónico Monumento Natural del Cerro de la Silla.", "🏭 Cuna de la fundición e industrialización pesada del norte de México."], desbloqueado: true },
    'nl_spgg': { id: 'nl_spgg', nombre: 'San Pedro Garza García', poblacion: 132169, coordenadas: [25.6575, -100.4017], nivelActual: 0, precioBase: 1200000000, datosCuriosos: ["🏙️ Aloja el rascacielos Torre Obispado, uno de los más altos de Latinoamérica.", "🌲 Cuenta con el Parque Ecológico Chipinque en la Sierra Madre Oriental.", "💰 Es catalogado recurrentemente como el municipio con mayor ingreso per cápita del país."], desbloqueado: true },
    'nl_gpe': { id: 'nl_gpe', nombre: 'Guadalupe', poblacion: 643143, coordenadas: [25.6798, -100.2596], nivelActual: 0, precioBase: 350000000, datosCuriosos: ["⚽ Sede del Estadio BBVA, recinto mundialista de fútbol.", "🦜 Alberga el único río vivo del área metropolitana: el Río La Silla.", "🤠 Fundada originalmente bajo el nombre de misión de la Nueva Tlaxcala."], desbloqueado: true },

    // METROPOLITANOS BLOQUEADOS (EJE INDUSTRIAL PERIFÉRICO)
    'nl_sn': { id: 'nl_sn', nombre: 'San Nicolás de los Garza', poblacion: 412199, coordenadas: [25.7506, -100.2954], nivelActual: 0, precioBase: 500000000, datosCuriosos: ["🎓 Aloja el campus central de la Universidad Autónoma de Nuevo León (UANL).", "🐯 Territorio del Estadio Universitario, apodado 'El Volcán'.", "🥇 Municipio histórico líder en índices de alfabetización y desarrollo humano."], desbloqueado: false },
    'nl_apo': { id: 'nl_apo', nombre: 'Apodaca', poblacion: 656464, coordenadas: [25.7809, -100.1887], nivelActual: 0, precioBase: 650000000, datosCuriosos: ["✈️ Capital aeronáutica de la región al alojar los dos aeropuertos internacionales.", "🔌 Mayor Hub industrial de manufactura tecnológica y parques logísticos integrados.", "🧀 Reconocido históricamente por su producción artesanal de quesos y carnes."], desbloqueado: false },
    'nl_esc': { id: 'nl_esc', nombre: 'General Escobedo', poblacion: 483015, coordenadas: [25.8078, -100.3223], nivelActual: 0, precioBase: 450000000, datosCuriosos: ["🚛 Sede del principal Hub de interconexión logística hacia la frontera norte.", "🛡️ Nombrado en honor al militar Mariano Escobedo, héroe de la República.", "🏗️ Una de las zonas periféricas con el mayor crecimiento urbano e inmobiliario de la década."], desbloqueado: false },
    'nl_sc': { id: 'nl_sc', nombre: 'Santa Catarina', poblacion: 306322, coordenadas: [25.6749, -100.4633], nivelActual: 0, precioBase: 700000000, datosCuriosos: ["🌵 Puerta de acceso al imponente Parque Nacional Cañón de la Huasteca.", "🚗 Designada como el epicentro de la nueva era de electromovilidad automotriz de la región.", "💧 Antigua parada estratégica del siglo XIX para arrieros que comerciaban con el centro del país."], desbloqueado: false },
    'nl_jua': { id: 'nl_jua', nombre: 'Juárez', poblacion: 471523, coordenadas: [25.6425, -100.0911], nivelActual: 0, precioBase: 300000000, datosCuriosos: ["🥩 Famoso por su arraigada tradición gastronómica en la preparación de tamales.", "🍊 Zona de transición de llanuras que conectaba las fincas citrícolas con la capital.", "📈 Registró una explosión demográfica sin precedentes de vivienda de interés social."], desbloqueado: false },
    'nl_gar': { id: 'nl_gar', nombre: 'García', poblacion: 397205, coordenadas: [25.8114, -100.5947], nivelActual: 0, precioBase: 420000000, datosCuriosos: ["🦇 Cuna del paraje turístico Grutas de García, cavernas con fósiles marinos.", "🌵 Paisaje semidesértico montañoso que resguarda el centro histórico del General García.", "🏭 Antigua zona agraria convertida en un gigante de fundición automotriz pesada."], desbloqueado: false },
    'nl_cad': { id: 'nl_cad', nombre: 'Cadereyta Jiménez', poblacion: 122337, coordenadas: [25.5894, -99.9861], nivelActual: 0, precioBase: 380000000, datosCuriosos: ["🛢️ Sede de la Refinería Ingeniero Héctor R. Lara Sosa, pilar energético regional.", "⚾ Conocida como la cuna del béisbol en el estado de Nuevo León.", "🧹 Famosa por su producción tradicional de escobas de espiga de maíz."], desbloqueado: false },

    // REGIÓN CITRÍCOLA Y SUR (VALLES ECONÓMICOS)
    'nl_stg': { id: 'nl_stg', nombre: 'Santiago', poblacion: 46784, coordenadas: [25.4239, -100.1506], nivelActual: 0, precioBase: 850000000, datosCuriosos: ["✨ Declarado Pueblo Mágico gracias a su arquitectura colonial y calles empedradas.", "🌊 Alberga la Presa de la Boca, centro recreativo acuático de fin de semana.", "🥾 Custodia la Cascada Cola de Caballo en las faldas de la Sierra Madre."], desbloqueado: false },
    'nl_mon': { id: 'nl_mon', nombre: 'Montemorelos', poblacion: 67428, coordenadas: [25.1872, -99.8261], nivelActual: 0, precioBase: 320000000, datosCuriosos: ["🍊 Capital Naranjera de México, líder indiscutible de exportación citrícola.", "Monumental escultura de Don José María Morelos y Pavón en el cerro del Bellavista.", "🩺 Sede de una prestigiosa universidad médica y un sistema de salud del sureste."], desbloqueado: false },
    'nl_all': { id: 'nl_all', nombre: 'Allende', poblacion: 35289, coordenadas: [25.2803, -100.0219], nivelActual: 0, precioBase: 400000000, datosCuriosos: ["🚛 Posee una de las flotas de transporte de carga terrestre más grandes de la República.", "Cruza el cristalino Río Ramos, paraje ecoturístico protegido.", "🐝 Reconocido internacionalmente por su alta calidad en la producción apícola de miel."], desbloqueado: false },
    'nl_gt': { id: 'nl_gt', nombre: 'General Terán', poblacion: 14109, coordenadas: [25.2603, -99.6147], nivelActual: 0, precioBase: 15000000, datosCuriosos: ["🎵 Cuna de la música norteña tradicional, inmortalizada por Los Alegres de Terán.", "🎈 Famoso por su festival anual de globos aerostáticos sobre los campos citrícolas.", "🏛️ Nombrado en honor al militar insurgente Manuel Mier y Terán."], desbloqueado: false },
    'nl_lin': { id: 'nl_lin', nombre: 'Linares', poblacion: 84666, coordenadas: [24.8583, -99.5656], nivelActual: 0, precioBase: 600000000, datosCuriosos: ["🍬 Famoso mundialmente por sus dulces artesanales de leche de cabra llamados 'Glorias'.", "🎻 Tierra de la Tambora y el Clarinete, expresiones musicales típicas del estado.", "🏰 Resguarda el Palacio Municipal y la Catedral de San Felipe Apóstol."], desbloqueado: false },
    'nl_hua': { id: 'nl_hua', nombre: 'Hualahuises', poblacion: 7025, coordenadas: [24.9311, -99.6311], nivelActual: 0, precioBase: 95000000, datosCuriosos: ["🪘 Famoso por sus talleres artesanales dedicados a la fabricación de guantes de béisbol.", "Enclavado geográficamente de manera interna en el territorio de Linares.", "🌉 Cuenta con puentes colgantes tradicionales sobre el Río Hualahuises."], desbloqueado: false },

    // REGIÓN SUR EXTENSIVO (ALTIPLANO Y SIERRA DE GALEANA)
    'nl_gal': { id: 'nl_gal', nombre: 'Galeana', poblacion: 40948, coordenadas: [24.8258, -100.0717], nivelActual: 0, precioBase: 250000000, datosCuriosos: ["⛰️ El municipio con mayor extensión territorial de todo el estado de Nuevo León.", "🕳️ Cuenta con el Pozo del Gavilán, un cenote misterioso en pleno altiplano sierra.", "🥔 Principal productor de papa de alta calidad en el norte del país."], desbloqueado: false },
    'nl_da': { id: 'nl_da', nombre: 'Doctor Arroyo', poblacion: 35445, coordenadas: [23.6731, -100.1794], nivelActual: 0, precioBase: 180000000, datosCuriosos: ["🌵 Ubicado en la región del semidesierto del extremo sur neolonés.", "🏛️ Fundado a mediados del siglo XIX y nombrado en memoria del Doctor José Francisco Arroyo.", "🧶 Tradición de tejidos artesanales de ixtle extraídos de las plantas de lechuguilla."], desbloqueado: false },
    'nl_ara': { id: 'nl_ara', nombre: 'Aramberri', poblacion: 14992, coordenadas: [24.0983, -99.8222], nivelActual: 0, precioBase: 120000000, datosCuriosos: ["🦖 Famoso por el descubrimiento paleontológico del reptil marino 'Monstruo de Aramberri'.", "🥑 Productor serrano de aguacate criollo de excelente sabor.", "🌊 Cuenta con nacimientos de agua cristalina entre desfiladeros montañosos."], desbloqueado: false },
    'nl_gz': { id: 'nl_gz', nombre: 'General Zaragoza', poblacion: 6282, coordenadas: [23.9744, -99.7719], nivelActual: 0, precioBase: 140000000, datosCuriosos: ["🌊 Oasis del sur que resguarda el Parque Recreativo El Salto con imponentes cascadas.", "🌲 Clima boscoso templado rodeado de pinos en lo alto de la Sierra Madre.", "🪵 Tradición maderera sustentable controlada por ejidos locales."], desbloqueado: false },
    'nl_mn': { id: 'nl_mn', nombre: 'Mier y Noriega', poblacion: 7008, coordenadas: [23.4214, -100.1175], nivelActual: 0, precioBase: 80000000, datosCuriosos: ["🗺️ Es el municipio ubicado en el extremo más meridional (sur) de Nuevo León.", "🌵 Comunidad de recolección de plantas de las zonas áridas del desierto chihuahuense.", "⛪ Iglesia de San Antonio de Padua, joya comunitaria del altiplano."], desbloqueado: false },
    'nl_itu': { id: 'nl_itu', nombre: 'Iturbide', poblacion: 3290, coordenadas: [24.7214, -99.8967], nivelActual: 0, precioBase: 75000000, datosCuriosos: ["🌌 Aloja el Observatorio Astronómico Nacional en el Cerro de la Santa Marta.", "🎨 Custodia el mural esculpido en roca 'Los Altares' sobre la carretera serrana.", "🌲 Hermosa cabecera municipal metida en un cañón profundo de la sierra."], desbloqueado: false },
    'nl_ray': { id: 'nl_ray', nombre: 'Rayones', poblacion: 2340, coordenadas: [25.0131, -100.0811], nivelActual: 0, precioBase: 70000000, datosCuriosos: ["🌰 Capital de la Nuez de Castilla, celebrando su feria tradicional cada septiembre.", "🚌 Accesible históricamente por caminos esculpidos directamente en desfiladeros de roca.", "🏔️ Flanqueado por cañones colosales que protegen sus huertos frutales."], desbloqueado: false },

    // REGIÓN NORTE FRONTERIZO Y ORIENTE (LLANOS EXTREMOS)
    'nl_ana': { id: 'nl_ana', nombre: 'Anáhuac', poblacion: 18094, coordenadas: [27.2431, -100.1311], nivelActual: 0, precioBase: 290000000, datosCuriosos: ["🇲🇽 Único municipio de Nuevo León que comparte frontera física internacional con Estados Unidos.", "🚢 Aloja el Puerto Fronterizo Colombia, cruce aduanero de alta eficiencia.", "🌊 Alimentado por la Presa Don Martín para distritos de riego algodoneros."], desbloqueado: false },
    'nl_lam': { id: 'nl_lam', nombre: 'Lampazos de Naranjo', poblacion: 5351, coordenadas: [27.0225, -100.5117], nivelActual: 0, precioBase: 110000000, datosCuriosos: ["⚔️ Conocida históricamente como la 'Cuna de Héroes' por la gran cantidad de generales revolucionarios nacidos aquí.", "🪵 Aloja el icónico paraje Ojo de Agua rodeado de sabinos milenarios.", "🤠 Tierra ganadera de exportación de reses de alta calidad genética."], desbloqueado: false },
    'nl_bus': { id: 'nl_bus', nombre: 'Bustamante', poblacion: 3977, coordenadas: [26.5336, -100.5056], nivelActual: 0, precioBase: 150000000, datosCuriosos: ["🥖 Pueblo Mágico célebre por su pan tradicional horneado en hornos de leña de adobe.", "🎒 Custodia las Grutas de Palma, un sistema subterráneo de estalactitas y estalagmitas.", "🌴 Famoso por su arquitectura heredada de los colonos tlaxcaltecas del siglo XVII."], desbloqueado: false },
    'nl_sv': { id: 'nl_sv', nombre: 'Salinas Victoria', poblacion: 86766, coordenadas: [25.9644, -100.2922], nivelActual: 0, precioBase: 310000000, datosCuriosos: ["🏭 Sede de un colosal clúster industrial logístico de fundición pesada asiática.", "Nombrado en honor a las salinas históricas de la cuenca y al presidente Guadalupe Victoria.", "🥩 Famoso por su producción tradicional de machacado de res."], desbloqueado: false },
    'nl_sh': { id: 'nl_sh', nombre: 'Sabinas Hidalgo', poblacion: 34709, coordenadas: [26.5005, -100.1772], nivelActual: 0, precioBase: 280000000, datosCuriosos: ["🌳 Alberga el Parque La Turbina, paraje natural de manantiales al norte del estado.", "🧵 Capital textil histórica en la confección de vestidos y camisas del siglo XX.", "🍖 Famoso por su gastronomía basada en cabrito al pastor y cortes norteños."], desbloqueado: false },
    'nl_chi': { id: 'nl_chi', nombre: 'China', poblacion: 10860, coordenadas: [25.7011, -99.2372], nivelActual: 0, precioBase: 260000000, datosCuriosos: ["🌊 Resguarda la Presa El Cuchillo, el embalse de agua más grande que surte a Monterrey.", "🤠 Tierra vaquera con una de las identidades ganaderas más fuertes del oriente.", "📜 Fundada bajo el nombre de San Felipe de Jesús de China en el siglo XVIII."], desbloqueado: false }, // Limpiado typo residual 'unlocked'
    'nl_gb': { id: 'nl_gb', nombre: 'General Bravo', poblacion: 5506, coordenadas: [25.7981, -99.1764], nivelActual: 0, precioBase: 120000000, datosCuriosos: ["🦅 Zona llanera de matorral bajo ideal para la observación de fauna silvestre.", "🛣️ Punto de control intermedio estratégico en la carretera Monterrey-Reynosa.", "🏛️ Nombrado en honor al general insurgente y presidente Nicolás Bravo."], desbloqueado: false },
    'nl_cer': { id: 'nl_cer', nombre: 'Cerralvo', poblacion: 7574, coordenadas: [26.0894, -99.6156], nivelActual: 0, precioBase: 160000000, datosCuriosos: ["📜 Considerado el asentamiento español más antiguo del estado, fundado en 1582.", "🌳 Cuenta con el Parque Nacional El Sabinal, el parque nacional más pequeño del país.", "⚔️ Antiguo cuartel de operaciones militares coloniales del Nuevo Reino de León."], desbloqueado: false },
    'nl_agu': { id: 'nl_agu', nombre: 'Agualeguas', poblacion: 2408, coordenadas: [26.3131, -99.5447], nivelActual: 0, precioBase: 90000000, datosCuriosos: ["🏛️ Famoso a nivel nacional por visitas presidenciales históricas en los años 90.", "⛪ Templo de Nuestra Señora de Agualeguas, centro de peregrinación regional.", "🎵 Cuna de tradiciones musicales norteñas y de artesanos de sillar de piedra."], desbloqueado: false },
    'nl_min': { id: 'nl_min', nombre: 'Mina', poblacion: 6048, coordenadas: [25.9983, -100.5283], nivelActual: 0, precioBase: 130000000, datosCuriosos: ["🦴 Sede del prestigioso Museo de Bernabé de las Casas, que exhibe fósiles de mamuts.", "🌵 Custodia el paraje místico Boca de Potrerillos, la zona con más petroglifos rupestres del norte del país.", "📜 Nombrado en memoria del militar liberal insurgente Francisco Javier Mina."], desbloqueado: false },
    'nl_hid': { id: 'nl_hid', nombre: 'Hidalgo', poblacion: 16086, coordenadas: [25.9719, -100.4519], nivelActual: 0, precioBase: 110000000, datosCuriosos: ["🧗 Destino mundial de escalada en roca gracias a las imponentes paredes de Potrero Chico.", "🎒 Sede histórica de las primeras cementeras industriales que levantaron el norte del país.", "⛪ Santuario de Nuestra Señora de la Natividad, hito arquitectónico local."], desbloqueado: false },
    'nl_aba': { id: 'nl_aba', nombre: 'Abasolo', poblacion: 2974, coordenadas: [25.9467, -100.4011], nivelActual: 0, precioBase: 85000000, datosCuriosos: ["🔲 El municipio territorialmente más pequeño de todo el estado de Nuevo León.", "🏞️ Cuenta con el ojo de agua de Temozcal, un oasis entre cañones rocosos.", "📜 Fundado originalmente en el siglo XVII como la hacienda de Eguía."], desbloqueado: false },
    'nl_car': { id: 'nl_car', nombre: 'El Carmen', poblacion: 104432, coordenadas: [25.9317, -100.3711], nivelActual: 0, precioBase: 195000000, datosCuriosos: ["🏭 Registró un boom de crecimiento industrial y naves logísticas pesadas de manufactura.", "🍲 Célebre por su producción industrial tradicional de nuez y cajetas.", "🏗️ Pasó de ser una villa agrícola a una de las mayores urbes dormitorios del norte."], desbloqueado: false },
    'nl_cf': { id: 'nl_cf', nombre: 'Ciénega de Flores', poblacion: 68747, coordenadas: [25.9556, -100.1661], nivelActual: 0, precioBase: 210000000, datosCuriosos: ["🥩 La indiscutible Cuna del Machacado con Huevo, platillo insignia neolonés.", "🏭 Clúster logístico de fundición siderúrgica pesada y manufactura metalmecánica.", "📜 Debe su nombre a las ciénagas históricas y a las familias colonas de apellido Flores."], desbloqueado: false },
    'nl_zua': { id: 'nl_zua', nombre: 'General Zuazua', poblacion: 102149, coordenadas: [25.8942, -100.1089], nivelActual: 0, precioBase: 185000000, datosCuriosos: ["🏰 Resguarda la monumental Hacienda San Pedro, centro cultural restaurado de la UANL.", "🥩 Reconocido por sus tradicionales empalmes, platillo vaquero regional.", "🏗️ Una de las periferias con mayor expansión inmobiliaria masiva de la cuenca."], desbloqueado: false },
    'nl_pes': { id: 'nl_pes', nombre: 'Pesquería', poblacion: 147624, coordenadas: [25.7856, -100.0511], nivelActual: 0, precioBase: 620000000, datosCuriosos: ["🇺🇦 Epicentro mundial automotriz al alojar el gigantesco complejo de KIA Motors.", "📈 Registró el mayor porcentaje de crecimiento poblacional de todo México en el último censo.", "🌊 Cruza el Río Pesquería, hito geográfico que da nombre al territorio."], desbloqueado: false },
    'nl_mar': { id: 'nl_mar', nombre: 'Marín', poblacion: 5119, coordenadas: [25.8792, -100.0461], nivelActual: 0, precioBase: 80000000, datosCuriosos: ["🎓 Aloja la Facultad de Agronomía de la Universidad Autónoma de Nuevo León.", "🧁 Famoso por su panadería tradicional y los icónicos dulces de leche quemada.", "🏛️ Nombrado en honor al obispo Primo Feliciano Marín de Porras."], desbloqueado: false },
    'nl_dg': { id: 'nl_dg', nombre: 'Doctor González', poblacion: 3256, coordenadas: [25.8594, -99.9461], nivelActual: 0, precioBase: 65000000, datosCuriosos: ["📜 Fundada originalmente como la Hacienda de Ramos en el siglo XVII.", "🌳 Paisajes pacíficos de matorral bajo aptos para la apicultura ovina.", "🏛️ Nombrado en honor al destacado médico y gobernador Doctor José Eleuterio González 'Gonzalitos'."], desbloqueado: false },
    'nl_hig': { id: 'nl_hig', nombre: 'Higueras', poblacion: 1578, coordenadas: [25.9639, -100.0114], nivelActual: 0, precioBase: 55000000, datosCuriosos: ["🌿 Capital Mundial del Orégano, debido a la excelente calidad silvestre cosechada en sus cerros.", "🔥 Famoso por la quema tradicional de la 'Candelilla' cada diciembre.", "🏛️ Municipio pionero en proyectos ecológicos de conservación ambiental sustentable."], desbloqueado: false },
    'nl_val': { id: 'nl_val', nombre: 'Vallecillo', poblacion: 1552, coordenadas: [26.6575, -99.9889], nivelActual: 0, precioBase: 60000000, datosCuriosos: ["🪙 Próspero centro minero de plata del siglo XVIII bajo la corona española.", "🏛️ Su arquitectura histórica cuenta con fachadas de sillar de cantera rosa abandonadas.", "📜 Antiguamente llamado Real de San Carlos de Vallecillo."], desbloqueado: false },
    'nl_vil': { id: 'nl_vil', nombre: 'Villaldama', poblacion: 3573, coordenadas: [26.5011, -100.4311], nivelActual: 0, precioBase: 70000000, datosCuriosos: ["🪙 Importante centro de explotación de minas de zinc y plomo del siglo XIX.", "🔲 Resguarda la Estación del Ferrocarril histórica, hito comercial porfiriano.", "🏛️ Nombrado en memoria del abogado insurgente Juan Aldama."], desbloqueado: false },
    'nl_par': { id: 'nl_par', nombre: 'Parás', poblacion: 906, coordenadas: [26.5019, -99.4311], nivelActual: 0, precioBase: 50000000, datosCuriosos: ["🔲 Uno de los municipios con menor densidad poblacional de todo el estado.", "🤠 Fuerte vocación agraria ganadera de exportación de becerros hacia el norte.", "🏛️ Fundado a mediados del siglo XIX bajo el mandato del gobernador José María Parás."], desbloqueado: false },
    'nl_mo': { id: 'nl_mo', nombre: 'Melchor Ocampo', poblacion: 1483, coordenadas: [26.0556, -99.4678], nivelActual: 0, precioBase: 45000000, datosCuriosos: ["📜 Originalmente llamado congregación de San José, elevado a municipio en 1948.", "🌵 Llanura árida norestense dedicada a la cría extensiva de ganado caprino.", "🏛️ Bautizado en honor al político liberal de la Reforma, Melchor Ocampo."], desbloqueado: false },
    'nl_dc': { id: 'nl_dc', nombre: 'Doctor Coss', poblacion: 1360, coordenadas: [25.9314, -99.1656], nivelActual: 0, precioBase: 50000000, datosCuriosos: ["📜 Terreno de llanuras de pastoreo fronterizo colonizado en el siglo XVIII.", "🏛️ Nombrado en memoria del Doctor José María Coss, diputado del Congreso de Chilpancingo.", "🤠 Comunidad rural dedicada a la preservación de costumbres vaqueras del noreste."], desbloqueado: false },
    'nl_la': { id: 'nl_la', nombre: 'Los Aldamas', poblacion: 1407, coordenadas: [26.0611, -99.1389], nivelActual: 0, precioBase: 48000000, datosCuriosos: ["📜 Dividido históricamente de Cerralvo a inicios del siglo XIX.", "🏛️ Bautizado en honor conjunto a los hermanos insurgentes Juan e Ignacio Aldama.", "🪵 Paisaje caracterizado por el matorral espinoso tamaulipeco y ganadería ovina."], desbloqueado: false },
    'nl_lh': { id: 'nl_lh', nombre: 'Los Herreras', poblacion: 1959, coordenadas: [25.8894, -99.4556], levelActual: 0, precioBase: 52000000, datosCuriosos: ["🎵 Cuna musical de talentos norteños tradicionales e ilustres educadores rurales.", "📜 Elevado al rango de municipio en 1874 bajo el decreto del Congreso local.", "🏛️ Rinde honor a los hermanos Herrera, militares héroes de la batalla de San Jacinto."], nivelActual: 0, desbloqueado: false },
    'nl_lr': { id: 'nl_lr', nombre: 'Los Ramones', poblacion: 5389, coordenadas: [25.6311, -99.6178], nivelActual: 0, precioBase: 60000000, datosCuriosos: ["🎵 La gloriosa Cuna de los Cadetes de Linares, leyendas de la música norteña.", "🍲 Famoso por sus guisados de asado de puerco y pan de elote rústico.", "🏛️ Bautizado en honor a los militares insurgentes Juan Ignacio y Buenaventura Ramón."], desbloqueado: false },
    'nl_gtv': { id: 'nl_gtv', nombre: 'General Treviño', poblacion: 1808, coordenadas: [26.2225, -99.4811], nivelActual: 0, precioBase: 46000000, datosCuriosos: ["📜 Antiguamente llamado rancho 'El Puntiagudo' debido a la forma de sus lomas.", "🏛️ Elevado a municipio en 1868 y nombrado en honor al general Jerónimo Treviño.", "🤠 Comunidad pacífica dedicada a la engorda de ganado bovino de registro."], desbloqueado: false }
  },
  conexiones: [],
  alertas: [],
  
  conmutarHud: () => set((state) => ({ isHudCollapsed: !state.isHudCollapsed })),

  conmutarTema: () => set((state) => {
    const nuevoTema = state.tema === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', nuevoTema === 'dark');
    }
    return { tema: nuevoTema };
  }),

  setViewFocus: (focus) => set({ currentViewFocus: focus }),
  agregarDinero: (cantidad) => set((state) => ({ dinero: state.dinero + cantidad })),
  removerAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),

  subirNivelNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.nivelActual >= 10 || !nodo.desbloqueado) return {};

    const costo = nodo.nivelActual === 0 ? nodo.precioBase : Math.floor(nodo.precioBase * Math.pow(1.9, nodo.nivelActual));
    if (state.dinero < costo) return {};

    const nuevoNivel = nodo.nivelActual + 1;
    let llavesExtra = state.llavesDeLaCiudad;
    let nuevasAlertas = [...state.alertas];

    if (nuevoNivel === 10) {
      llavesExtra += 1;
      nuevasAlertas.push({
        id: crypto.randomUUID(), // 🔥 IDs deterministas
        tipo: 'max_level', // Corrección del tipado unión anterior
        icono: '👑',
        mensaje: `¡${nodo.nombre} Desarrollado!`,
        microcopy: `Has ganado 1 Token de Expansión Territorial Federal.`
      });
    } else {
      nuevasAlertas.push({
        id: crypto.randomUUID(),
        tipo: 'success',
        icono: '📈',
        mensaje: `${nodo.nombre} Ascendió`,
        microcopy: `Ahora es una ciudad más grande con más habitantes. ¡PIB en aumento!`
      });
    }

    return {
      dinero: state.dinero - costo,
      llavesDeLaCiudad: llavesExtra, // 🔥 SOLUCIÓN: Cambiado campo tokensDesbloqueo a llavesDeLaCiudad
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
        id: crypto.randomUUID(),
        tipo: 'build',
        icono: '🚀',
        mensaje: `Eje Vial Conectado`,
        microcopy: `Red vial expandida entre ${origen.nombre} y ${destino.nombre} (${formatearDinero(costoCarretera)}).`
      }]
    }));
  },

  intentarDesbloquearNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.desbloqueado || state.llavesDeLaCiudad <= 0) return {};

    return {
      llavesDeLaCiudad: state.llavesDeLaCiudad - 1, // 🔥 SOLUCIÓN: Cambiado campo tokensDesbloqueo a llavesDeLaCiudad
      alertas: [...state.alertas, {
        id: crypto.randomUUID(),
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
    if (idx === -1) return {};
    const conexion = state.conexiones[idx]!;
    
    // 🔥 REGLA SOLICITADA: La ampliación ahora cuesta proporcionalmente el 20% del puente original
    const costo = conexion.costoConstruccion * 0.20; 
    
    if (state.dinero < costo || conexion.carriles >= 6) return {};

    const copias = [...state.conexiones];
    copias[idx] = { ...conexion, carriles: conexion.carriles + 1 };
    return {
      dinero: state.dinero - costo,
      conexiones: copias,
      alertas: [...state.alertas, {
        id: crypto.randomUUID(),
        tipo: 'build',
        icono: '🛣️',
        mensaje: `Infraestructura Ampliada`,
        microcopy: `Autopista mejorada a ${conexion.carriles + 1} carriles de alta velocidad.`
      }]
    };
  }),

  lanzarQuizPregunta: () => {
    const state = get();
    const adquiridos = Object.values(state.municipios).filter(m => m.nivelActual > 0);
    if (adquiridos.length === 0) return;

    const ciudadRandom = adquiridos[Math.floor(Math.random() * adquiridos.length)]!;
    const datoRandom = ciudadRandom.datosCuriosos[Math.floor(Math.random() * ciudadRandom.datosCuriosos.length)]!;

    const proximasCiudades = Object.values(state.municipios).filter(m => !m.desbloqueado);
    const ciudadReferencia = proximasCiudades.length > 0 
      ? proximasCiudades.reduce((prev, curr) => prev.precioBase < curr.precioBase ? prev : curr)
      : { precioBase: 500000000 };

    const recompensaCalculada = Math.floor(ciudadReferencia.precioBase * 0.5);

    const distractores = Object.values(state.municipios)
      .filter(m => m.id !== ciudadRandom.id)
      .map(m => m.nombre);
    
    const opcionA = distractores[0] || "San Nicolás";
    const opcionB = distractores[1] || "Apodaca";

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
      set((state) => ({ dinero: state.dinero + quiz.recompensaEstimada }));
      nuevasAlertas.push({
        id: crypto.randomUUID(),
        tipo: 'success',
        icono: '🧠',
        mensaje: 'Premio Intelectual Concedido',
        microcopy: `¡Excelente! Has sumado fondos federales para expandir tu red.`
      });

      return {
        exito: true,
        mensaje: "¡Respuesta Correcta!",
        microcopy: `Tu conocimiento de la geografía del estado te ha otorgado un estímulo financiero de ${formatearDinero(quiz.recompensaEstimada)}.`
      };
    } else {
      nuevasAlertas.push({
        id: crypto.randomUUID(),
        tipo: 'unlock',
        icono: '❌',
        mensaje: 'Examen de Geografía Reprobado',
        microcopy: 'Sigue repasando las fichas satelitales de los municipios.'
      });

      return {
        exito: false,
        mensaje: "Respuesta Incorrecta",
        microcopy: "El consejo hacendario ha retenido los fondos esta vez. ¡Sigue leyendo los datos curiosos!"
      };
    }
  },

  cerrarQuiz: () => set({ quizActivo: null })
}));