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
  nodoAsociadoId: string; // ID del nodo al que pertenece esta trivia
}

interface GameState {
  dinero: number;
  tema: 'light' | 'dark';
  llavesDeLaCiudad: number;
  currentViewFocus: 'municipio' | 'estado' | 'pais';
  isHudCollapsed: boolean;
  municipios: Record<string, Municipio>;
  conexiones: Conexion[];
  alertas: GameAlert[];
  quizActivo: QuizQuestion | null;
  ultimosNodosActivados: string[]; // Historial FIFO de los últimos 5 nodos activados/comprados
  conmutarTema: () => void;
  setViewFocus: (focus: 'municipio' | 'estado' | 'pais') => void;
  conmutarHud: () => void;
  agregarDinero: (cantidad: number) => void;
  subirNivelNodo: (id: string) => void;
  intentarConectarNodos: (desdeId: string, hastaId: string) => void;
  intentarDesbloquearNodo: (id: string) => void;
  mejorarCarretera: (id: string) => void;
  removerAlerta: (id: string) => void;
  lanzarQuizPregunta: () => void;
  responderQuizPregunta: (indexSeleccionado: number) => { exito: boolean; mensaje: string; microcopy: string };
  cerrarQuiz: () => void;
  procesarSegundoJuego: () => void; // Ciclo de ganancias pasivas acelerado
  inicializarJuegoNuevo: () => string; // Devuelve el ID del nodo de inicio para centrar mapa
}

export const formatearDinero = (val: number): string => {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
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

// Helper de alertas que limita la cola a un máximo de 1 elemento (Elimina alertas dobles)
const agregarAlertaUnica = (nuevaAlerta: GameAlert): GameAlert[] => {
  return [nuevaAlerta];
};

const BASE_MUNICIPIOS_DATA: Record<string, Omit<Municipio, 'desbloqueado' | 'nivelActual'>> = {
  'nl_mty': { id: 'nl_mty', nombre: 'Monterrey', poblacion: 1142994, coordenadas: [25.6866, -100.3161], precioBase: 400000000, datosCuriosos: ["🏛️ Conocida como la Sultana del Norte.", "⛰️ Resguarda el icónico Monumento Natural del Cerro de la Silla.", "🏭 Cuna de la fundición e industrialización pesada del norte de México."] },
  'nl_spgg': { id: 'nl_spgg', nombre: 'San Pedro Garza García', poblacion: 132169, coordenadas: [25.6575, -100.4017], precioBase: 1200000000, datosCuriosos: ["🏙️ Aloja el rascacielos Torre Obispado, uno de los más altos de Latinoamérica.", "🌲 Cuenta con el Parque Ecológico Chipinque en la Sierra Madre Oriental.", "💰 Es catalogado recurrentemente como el municipio con mayor ingreso per cápita del país."] },
  'nl_gpe': { id: 'nl_gpe', nombre: 'Guadalupe', poblacion: 643143, coordenadas: [25.6798, -100.2596], precioBase: 350000000, datosCuriosos: ["⚽ Sede del Estadio BBVA, recinto mundialista de fútbol.", "🦜 Alberga el único río vivo del área metropolitana: el Río La Silla.", "🤠 Fundada originalmente bajo el nombre de misión de la Nueva Tlaxcala."] },
  'nl_sn': { id: 'nl_sn', nombre: 'San Nicolás de los Garza', poblacion: 412199, coordenadas: [25.7506, -100.2954], precioBase: 500000000, datosCuriosos: ["🎓 Aloja el campus central de la Universidad Autónoma de Nuevo León (UANL).", "🐯 Territorio del Estadio Universitario, apodado 'El Volcán'.", "🥇 Municipio histórico líder en índices de alfabetización y desarrollo humano."] },
  'nl_apo': { id: 'nl_apo', nombre: 'Apodaca', poblacion: 656464, coordenadas: [25.7809, -100.1887], precioBase: 650000000, datosCuriosos: ["✈️ Capital aeronáutica de la región al alojar los dos aeropuertos internacionales.", "🔌 Mayor Hub industrial de manufactura tecnológica y parques logísticos integrados.", "🧀 Reconocido históricamente por su producción artesanal de quesos y carnes."] },
  'nl_esc': { id: 'nl_esc', nombre: 'General Escobedo', poblacion: 483015, coordenadas: [25.8078, -100.3223], precioBase: 450000000, datosCuriosos: ["🚛 Sede del principal Hub de interconexion logística hacia la frontera norte.", "🛡️ Nombrado en honor al militar Mariano Escobedo, héroe de la República.", "🏗️ Una de las zonas periféricas con el mayor crecimiento urbano e inmobiliario de la década."] },
  'nl_sc': { id: 'nl_sc', nombre: 'Santa Catarina', poblacion: 306322, coordenadas: [25.6749, -100.4633], precioBase: 700000000, datosCuriosos: ["🌵 Puerta de acceso al imponente Parque Nacional Cañón de la Huasteca.", "🚗 Designada como el epicentro de la nueva era de electromovilidad automotriz de la región.", "💧 Antigua parada estratégica del siglo XIX para arrieros que comerciaban con el centro del país."] },
  'nl_jua': { id: 'nl_jua', nombre: 'Juárez', poblacion: 471523, coordenadas: [25.6425, -100.0911], precioBase: 300000000, datosCuriosos: ["🥩 Famoso por su arraigada tradición gastronómica en la preparación de tamales.", "🍊 Zona de transición de llanuras que conectaba las fincas citrícolas con la capital.", "📈 Registró una explosión demográfica sin precedentes de vivienda de interés social."] },
  'nl_gar': { id: 'nl_gar', nombre: 'García', poblacion: 397205, coordenadas: [25.8114, -100.5947], precioBase: 420000000, datosCuriosos: ["🦇 Cuna del paraje turístico Grutas de García, cavernas con fósiles marinos.", "🌵 Paisaje semidesértico montañoso que resguarda el centro histórico del General García.", "🏭 Antigua zona agraria convertida en un gigante de fundición automotriz pesada."] },
  'nl_cad': { id: 'nl_cad', nombre: 'Cadereyta Jiménez', poblacion: 122337, coordenadas: [25.5894, -99.9861], precioBase: 380000000, datosCuriosos: ["🛢️ Sede de la Refinería Ingeniero Héctor R. Lara Sosa, pilar energético regional.", "⚾ Conocida como la cuna del béisbol en el estado de Nuevo León.", "🧹 Famosa por su producción tradicional de escobas de espiga de maíz."] },
  'nl_stg': { id: 'nl_stg', nombre: 'Santiago', poblacion: 46784, coordenadas: [25.4239, -100.1506], precioBase: 850000000, datosCuriosos: ["✨ Declarado Pueblo Mágico gracias a su arquitectura colonial y calles empedradas.", "🌊 Alberga la Presa de la Boca, centro recreativo acuático de fin de semana.", "🥾 Custodia la Cascada Cola de Caballo en las faldas de la Sierra Madre."] },
  'nl_mon': { id: 'nl_mon', nombre: 'Montemorelos', poblacion: 67428, coordenadas: [25.1872, -99.8261], precioBase: 320000000, datosCuriosos: ["🍊 Capital Naranjera de México, líder indiscutible de exportación citrícola.", "🏛️ Monumental edificio esculpido de Don José María Morelos y Pavón.", "🩺 Sede de una prestigiosa universidad médica y un sistema de salud del sureste."] },
  'nl_all': { id: 'nl_all', nombre: 'Allende', poblacion: 35289, coordenadas: [25.2803, -100.0219], precioBase: 400000000, datosCuriosos: ["🚛 Posee una de las flotas de transporte de carga terrestre más grandes.", "🏞️ Cruza el cristalino Río Ramos, paraje ecoturístico protegido.", "🐝 Reconocido internacionalmente por su alta calidad en la producción apícola."] },
  'nl_gt': { id: 'nl_gt', nombre: 'General Terán', poblacion: 14109, coordenadas: [25.2603, -99.6147], precioBase: 150000000, datosCuriosos: ["🎵 Cuna de la música norteña tradicional por Los Alegres de Terán.", "🎈 Famoso por su festival anual de globos aerostáticos.", "🏛️ Nombrado en honor al militar insurgente Manuel Mier y Terán."] },
  'nl_lin': { id: 'nl_lin', nombre: 'Linares', poblacion: 84666, coordenadas: [24.8583, -99.5656], precioBase: 600000000, datosCuriosos: ["🍬 Famoso mundialmente por sus dulces artesanales llamados 'Glorias'.", "🎻 Tierra de la Tambora y el Clarinete, expresiones musicales típicas.", "🏰 Resguarda el Palacio Municipal y la Catedral de San Felipe Apóstol."] },
  'nl_hua': { id: 'nl_hua', nombre: 'Hualahuises', poblacion: 7025, coordenadas: [24.9311, -99.6311], precioBase: 95000000, datosCuriosos: ["🪘 Famoso por sus talleres dedicados a la fabricación de guantes de béisbol.", "🏡 Enclavado geográficamente de manera interna en el territorio de Linares.", "🌉 Cuenta con puentes colgantes tradicionales sobre el Río Hualahuises."] },
  'nl_gal': { id: 'nl_gal', nombre: 'Galeana', poblacion: 40948, coordenadas: [24.8258, -100.0717], precioBase: 250000000, datosCuriosos: ["⛰️ El municipio con mayor extensión territorial de todo el estado.", "🕳️ Cuenta con el Pozo del Gavilán, un cenote misterioso en la sierra.", "🥔 Principal productor de papa de alta calidad en el norte del país."] },
  'nl_da': { id: 'nl_da', nombre: 'Doctor Arroyo', poblacion: 35445, coordenadas: [23.6731, -100.1794], precioBase: 180000000, datosCuriosos: ["🌵 Ubicado en la región del semidesierto del extremo sur neolonés.", "🏛️ Fundado en memoria del Doctor José Francisco Arroyo.", "🧶 Tradición de tejidos artesanales de ixtle extraídos de la lechuguilla."] },
  'nl_ara': { id: 'nl_ara', nombre: 'Aramberri', poblacion: 14992, coordenadas: [24.0983, -99.8222], precioBase: 120000000, datosCuriosos: ["🦖 Famoso por el descubrimiento fósil del 'Monstruo de Aramberri'.", "🥑 Productor serrano de aguacate criollo de excelente sabor.", "🌊 Cuenta con nacimientos de agua cristalina entre desfiladeros."] },
  'nl_gz': { id: 'nl_gz', nombre: 'General Zaragoza', poblacion: 6282, coordenadas: [23.9744, -99.7719], precioBase: 140000000, datosCuriosos: ["🌊 Oasis del sur que resguarda el Parque El Salto con imponentes cascadas.", "🌲 Clima boscoso templado rodeado de pinos en lo alto de la sierra.", "🪵 Tradición maderera sustentable controlada por ejidos locales."] },
  'nl_mn': { id: 'nl_mn', nombre: 'Mier y Noriega', poblacion: 7008, coordenadas: [23.4214, -100.1175], precioBase: 80000000, datosCuriosos: ["🗺️ Es el municipio ubicado en el extremo más sur de Nuevo León.", "🌵 Comunidad de recolección de plantas del desierto chihuahuense.", "⛪ Iglesia de San Antonio de Padua, joya del altiplano."] },
  'nl_itu': { id: 'nl_itu', nombre: 'Iturbide', poblacion: 3290, coordenadas: [24.7214, -99.8967], precioBase: 75000000, datosCuriosos: ["🌌 Aloja el Observatorio Astronómico Nacional en el Cerro de la Santa Marta.", "🎨 Custodia el mural esculpido en roca 'Los Altares'.", "🌲 Cabecera municipal metida en un cañón profundo de la sierra."] },
  'nl_ray': { id: 'nl_ray', nombre: 'Rayones', poblacion: 2340, coordenadas: [25.0131, -100.0811], precioBase: 70000000, datosCuriosos: ["🌰 Capital de la Nuez de Castilla, celebrando su feria cada septiembre.", "🚌 Accesible por caminos esculpidos directamente en desfiladeros de roca.", "🏔️ Flanqueado por cañones colosales que protegen sus huertos."] },
  'nl_ana': { id: 'nl_ana', nombre: 'Anáhuac', poblacion: 18094, coordenadas: [27.2431, -100.1311], precioBase: 290000000, datosCuriosos: ["🇲🇽 Único municipio que comparte frontera internacional con EE. UU.", "🚢 Aloja el Puerto Fronterizo Colombia de alta eficiencia.", "🌊 Alimentado por la Presa Don Martín para riego algodonero."] },
  'nl_lam': { id: 'nl_lam', nombre: 'Lampazos de Naranjo', poblacion: 5351, coordenadas: [27.0225, -100.5117], precioBase: 110000000, datosCuriosos: ["⚔️ Conocida históricamente como la 'Cuna de Héroes' revolucionarios.", "🪵 Aloja el icónico paraje Ojo de Agua rodeado de sabinos milenarios.", "🤠 Tierra ganadera de exportación de alta calidad genética."] },
  'nl_bus': { id: 'nl_bus', nombre: 'Bustamante', poblacion: 3977, coordenadas: [26.5336, -100.5056], precioBase: 150000000, datosCuriosos: ["🥖 Pueblo Mágico célebre por su pan tradicional en hornos de adobe.", "🎒 Custodia las Grutas de Palma, sistema subterráneo monumental.", "🌴 Arquitectura heredada de los colonos tlaxcaltecas del siglo XVII."] },
  'nl_sv': { id: 'nl_sv', nombre: 'Salinas Victoria', poblacion: 86766, coordenadas: [25.9644, -100.2922], precioBase: 310000000, datosCuriosos: ["🏭 Sede de un colosal clúster industrial logístico asiático.", "📝 Nombrado en honor a las salinas históricas y al presidente Victoria.", "🥩 Famoso por su producción tradicional de machacado de res."] },
  'nl_sh': { id: 'nl_sh', nombre: 'Sabinas Hidalgo', poblacion: 34709, coordenadas: [26.5005, -100.1772], precioBase: 280000000, datosCuriosos: ["🌳 Alberga el Parque La Turbina, paraje de manantiales al norte.", "🧵 Capital textil histórica en la confección de vestidos del siglo XX.", "🍖 Famoso por su gastronomía basada en cabrito al pastor."] },
  'nl_chi': { id: 'nl_chi', nombre: 'China', poblacion: 10860, coordenadas: [25.7011, -99.2372], precioBase: 260000000, datosCuriosos: ["🌊 Resguarda la Presa El Cuchillo, el embalse que surte a Monterrey.", "🤠 Tierra vaquera con una de las identidades ganaderas más fuertes.", "📜 Fundada bajo el nombre de San Felipe de Jesús de China."] },
  'nl_gb': { id: 'nl_gb', nombre: 'General Bravo', poblacion: 5506, coordenadas: [25.7981, -99.1764], precioBase: 120000000, datosCuriosos: ["🦅 Zona llanera de matorral bajo ideal para la observación de fauna.", "🛣️ Punto de control intermedio estratégico en la ruta a Reynosa.", "🏛️ Nombrado en honor al general insurgente Nicolás Bravo."] },
  'nl_cer': { id: 'nl_cer', nombre: 'Cerralvo', poblacion: 7574, coordenadas: [26.0894, -99.6156], precioBase: 160000000, datosCuriosos: ["📜 Considerado el asentamiento español más antiguo, fundado en 1582.", "🌳 Cuenta con el Parque Nacional El Sabinal, el más pequeño del país.", "⚔️ Antiguo cuartel de operaciones militares coloniales."] },
  'nl_agu': { id: 'nl_agu', nombre: 'Agualeguas', poblacion: 2408, coordenadas: [26.3131, -99.5447], precioBase: 90000000, datosCuriosos: ["🏛️ Famoso a nivel nacional por visitas presidenciales en los 90.", "⛪ Templo de Nuestra Señora de Agualeguas, centro de peregrinación.", "🎵 Cuna de tradiciones musicales norteñas y sillar de piedra."] },
  'nl_min': { id: 'nl_min', nombre: 'Mina', poblacion: 6048, coordenadas: [25.9983, -100.5283], precioBase: 130000000, datosCuriosos: ["🦴 Sede del Museo Bernabé de las Casas, que exhibe fósiles de mamut.", "🌵 Custodia Boca de Potrerillos, zona con más petroglifos rupestres.", "📜 Nombrado en memoria del insurgente Francisco Javier Mina."] },
  'nl_hid': { id: 'nl_hid', nombre: 'Hidalgo', poblacion: 16086, coordenadas: [25.9719, -100.4519], precioBase: 110000000, datosCuriosos: ["🧗 Destino mundial de escalada en roca en Potrero Chico.", "🏭 Sede histórica de las primeras cementeras que levantaron el norte.", "⛪ Santuario de Nuestra Señora de la Natividad."] },
  'nl_aba': { id: 'nl_aba', nombre: 'Abasolo', poblacion: 2974, coordenadas: [25.9467, -100.4011], precioBase: 85000000, datosCuriosos: ["🔲 El municipio territorialmente más pequeño de todo el estado.", "🏞️ Cuenta con el ojo de agua de Temozcal, oasis entre cañones.", "📜 Fundado originalmente en el siglo XVII como hacienda de Eguía."] },
  'nl_car': { id: 'nl_car', nombre: 'El Carmen', poblacion: 104432, coordenadas: [25.9317, -100.3711], precioBase: 195000000, datosCuriosos: ["🏭 Registró un boom de crecimiento industrial masivo.", "🍲 Célebre por su producción de nuez y cajetas artesanales.", "🏗️ Pasó de villa agrícola a una de las mayores urbes dormitorios."] },
  'nl_cf': { id: 'nl_cf', nombre: 'Ciénega de Flores', poblacion: 68747, coordenadas: [25.9556, -100.1661], precioBase: 210000000, datosCuriosos: ["🥩 La indiscutible Cuna del Machacado con Huevo regional.", "🏭 Clúster logístico de fundición siderúrgica pesada.", "📜 Debe su nombre a las ciénagas históricas y a la familia Flores."] },
  'nl_zua': { id: 'nl_zua', nombre: 'General Zuazua', poblacion: 102149, coordenadas: [25.8942, -100.1089], precioBase: 185000000, datosCuriosos: ["🏰 Resguarda la monumental Hacienda San Pedro, centro de la UANL.", "🥩 Reconocido por sus tradicionales empalmes vaqueros.", "🏗️ Una de las periferias con mayor expansión inmobiliaria."] },
  'nl_pes': { id: 'nl_pes', nombre: 'Pesquería', poblacion: 147624, coordenadas: [25.7856, -100.0511], precioBase: 620000000, datosCuriosos: ["🇰🇷 Epicentro mundial automotriz al alojar el complejo de KIA Motors.", "📈 Registró el mayor crecimiento poblacional de México en el censo.", "🌊 Cruza el Río Pesquería, hito geográfico que da nombre al lugar."] },
  'nl_mar': { id: 'nl_mar', nombre: 'Marín', poblacion: 5119, coordenadas: [25.8792, -100.0461], precioBase: 80000000, datosCuriosos: ["🎓 Aloja la Facultad de Agronomía de la Universidad Autónoma (UANL).", "🧁 Famoso por su panadería tradicional y dulces de leche quemada.", "🏛️ Nombrado en honor al obispo Primo Feliciano Marín de Porras."] },
  'nl_dg': { id: 'nl_dg', nombre: 'Doctor González', poblacion: 3256, coordenadas: [25.8594, -99.9461], precioBase: 65000000, datosCuriosos: ["📜 Fundada originalmente como la Hacienda de Ramos en el siglo XVII.", "🌳 Paisajes pacíficos de matorral bajo aptos para ganadería.", "🏛️ Nombrado en honor a 'Gonzalitos', médico prócer de la salud."] },
  'nl_hig': { id: 'nl_hig', nombre: 'Higueras', poblacion: 1578, coordenadas: [25.9639, -100.0114], precioBase: 55000000, datosCuriosos: ["🌿 Capital Mundial del Orégano silvestre cosechado en sus cerros.", "🔥 Famoso por la quema tradicional de la 'Candelilla' en diciembre.", "🏛️ Municipio pionero en proyectos ecológicos sustentables."] },
  'nl_val': { id: 'nl_val', nombre: 'Vallecillo', poblacion: 1552, coordenadas: [26.6575, -99.9889], precioBase: 60000000, datosCuriosos: ["🪙 Próspero centro minero de plata del siglo XVIII colonial.", "🏛️ Arquitectura histórica con fachadas de sillar de cantera rosa.", "📜 Antiguamente llamado Real de San Carlos de Vallecillo."] },
  'nl_vil': { id: 'nl_vil', nombre: 'Villaldama', poblacion: 3573, coordenadas: [26.5011, -100.4311], precioBase: 70000000, datosCuriosos: ["🪙 Importante centro de explotación de minas de zinc del siglo XIX.", "🔲 Resguarda la Estación del Ferrocarril, hito comercial porfiriano.", "🏛️ Nombrado en memoria del insurgente Juan Aldama."] },
  'nl_par': { id: 'nl_par', nombre: 'Parás', poblacion: 906, coordenadas: [26.5019, -99.4311], precioBase: 50000000, datosCuriosos: ["🔲 Uno de los municipios con menor densidad poblacional del estado.", "🤠 Fuerte vocación ganadera de exportación hacia el norte.", "🏛️ Fundado bajo el mandato del gobernador José María Parás."] },
  'nl_mo': { id: 'nl_mo', nombre: 'Melchor Ocampo', poblacion: 1483, coordenadas: [26.0556, -99.4678], precioBase: 45000000, datosCuriosos: ["📜 Elevado a municipio en 1948, antes congregación de San José.", "🌵 Llanura árida norestense dedicada a la cría de ganado caprino.", "🏛️ Bautizado en honor al político de la Reforma Melchor Ocampo."] },
  'nl_dc': { id: 'nl_dc', nombre: 'Doctor Coss', poblacion: 1360, coordenadas: [25.9314, -99.1656], precioBase: 50000000, datosCuriosos: ["📜 Terreno de llanuras de pastoreo fronterizo colonizado en el siglo XVIII.", "🏛️ Nombrado en memoria de Doctor José María Coss.", "🤠 Comunidad rural dedicada a la preservación de costumbres vaqueras."] },
  'nl_la': { id: 'nl_la', nombre: 'Los Aldamas', poblacion: 1407, coordenadas: [26.0611, -99.1389], precioBase: 48000000, datosCuriosos: ["📜 Dividido históricamente de Cerralvo a inicios del siglo XIX.", "🏛️ Bautizado en honor a los hermanos Juan e Ignacio Aldama.", "🪵 Matorral espinoso tamaulipeco y ganadería ovina extensiva."] },
  'nl_lh': { id: 'nl_lh', nombre: 'Los Herreras', poblacion: 1959, coordenadas: [25.8894, -99.4556], precioBase: 52000000, datosCuriosos: ["🎵 Cuna musical de talentos norteños e ilustres educadores.", "📜 Elevado a rango de municipio en 1874 por decreto del Congreso.", "🏛️ Rinde honor a los militares héroes de la batalla de San Jacinto."] },
  'nl_lr': { id: 'nl_lr', nombre: 'Los Ramones', poblacion: 5389, coordenadas: [25.6311, -99.6178], precioBase: 60000000, datosCuriosos: ["🎵 La gloriosa Cuna de Los Cadetes de Linares, leyendas norteñas.", "🍲 Famoso por sus guisados de asado de puerco y pan de elote.", "🏛️ Bautizado en honor a los insurgentes Juan Ignacio y Buenaventura Ramón."] },
  'nl_gtv': { id: 'nl_gtv', nombre: 'General Treviño', poblacion: 1808, coordenadas: [26.2225, -99.4811], precioBase: 46000000, datosCuriosos: ["📜 Antiguamente llamado rancho 'El Puntiagudo' por sus lomas.", "🏛️ Elevado a municipio en 1868 en honor al general Jerónimo Treviño.", "🤠 Comunidad pacífica dedicada a la engorda de ganado bovino."] }
};

const generarMunicipiosEstaticos = (): Record<string, Municipio> => {
  const result: Record<string, Municipio> = {};
  Object.keys(BASE_MUNICIPIOS_DATA).forEach((key) => {
    result[key] = {
      ...BASE_MUNICIPIOS_DATA[key]!,
      nivelActual: key === 'nl_mty' ? 1 : 0,
      desbloqueado: key === 'nl_mty',
    };
  });
  return result;
};

export const useGameStore = create<GameState>()((set, get) => ({
  dinero: 300000000, // Tesoro estatal inicial acelerado x2 (300M)
  tema: 'dark',
  llavesDeLaCiudad: 3, 
  currentViewFocus: 'municipio',
  isHudCollapsed: false,
  quizActivo: null,
  ultimosNodosActivados: ['nl_mty'], 
  municipios: generarMunicipiosEstaticos(),
  conexiones: [],
  alertas: [],

  inicializarJuegoNuevo: () => {
    const ids = Object.keys(BASE_MUNICIPIOS_DATA);
    // Elegimos un nodo aleatorio para comenzar como recomendación
    const idRandom = ids[Math.floor(Math.random() * ids.length)] || 'nl_mty';

    const nuevosMunicipios: Record<string, Municipio> = {};
    ids.forEach((key) => {
      const isStartNode = key === idRandom;
      nuevosMunicipios[key] = {
        ...BASE_MUNICIPIOS_DATA[key]!,
        nivelActual: isStartNode ? 1 : 0,
        desbloqueado: isStartNode,
      };
    });

    const primeraAlerta: GameAlert = {
      id: crypto.randomUUID(),
      tipo: 'unlock',
      icono: '⭐',
      mensaje: `Sede Inicial: ${BASE_MUNICIPIOS_DATA[idRandom]!.nombre}`,
      microcopy: `Exploración aleatoria recomendada. ¡Se te concedieron 3 llaves de inicio!`
    };

    set({
      dinero: 300000000, 
      llavesDeLaCiudad: 3, 
      municipios: nuevosMunicipios,
      conexiones: [],
      alertas: [primeraAlerta],
      ultimosNodosActivados: [idRandom], 
      quizActivo: null
    });

    return idRandom; // Devuelve el id para centrar y hacer zoom en el mapa
  },

  conmutarTema: () => set((state) => {
    const nuevoTema = state.tema === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', nuevoTema === 'dark');
    }
    return { tema: nuevoTema };
  }),

  setViewFocus: (focus) => set({ currentViewFocus: focus }),
  conmutarHud: () => set((state) => ({ isHudCollapsed: !state.isHudCollapsed })),
  agregarDinero: (cantidad) => set((state) => ({ dinero: state.dinero + cantidad })),
  removerAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),

  subirNivelNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.nivelActual >= 10 || !nodo.desbloqueado) return {};

    const costo = nodo.nivelActual === 0 ? nodo.precioBase : Math.floor(nodo.precioBase * Math.pow(1.8, nodo.nivelActual));
    if (state.dinero < costo) return {};

    const nuevoNivel = nodo.nivelActual + 1;
    let llavesExtra = state.llavesDeLaCiudad;
    let nuevasAlertas = [...state.alertas];

    // Mantener historial FIFO de los últimos 5
    let nuevoHistorial = [...state.ultimosNodosActivados];
    nuevoHistorial = [id, ...nuevoHistorial.filter((x) => x !== id)].slice(0, 5);

    if (nuevoNivel === 10) {
      llavesExtra += 1;
      const alertaMax: GameAlert = {
        id: crypto.randomUUID(),
        tipo: 'max_level',
        icono: '👑',
        mensaje: `¡${nodo.nombre} al Máximo!`,
        microcopy: `Ganaste 1 Llave extra por completar la súper infraestructura estatal.`
      };
      nuevasAlertas = agregarAlertaUnica(alertaMax);
    } else {
      const alertaNivel: GameAlert = {
        id: crypto.randomUUID(),
        tipo: 'success',
        icono: '📈',
        mensaje: `${nodo.nombre} Ascendió a Lvl ${nuevoNivel}`,
        microcopy: `Tu recaudación pasiva en la región aumentó significativamente.`
      };
      nuevasAlertas = agregarAlertaUnica(alertaNivel);
    }

    return {
      dinero: state.dinero - costo,
      llavesDeLaCiudad: llavesExtra,
      alertas: nuevasAlertas,
      ultimosNodosActivados: nuevoHistorial,
      municipios: { ...state.municipios, [id]: { ...nodo, nivelActual: nuevoNivel } }
    };
  }),

  intentarConectarNodos: (desdeId, hastaId) => {
    const state = get();
    const origen = state.municipios[desdeId];
    const destino = state.municipios[hastaId];
    if (!origen || !destino || !origen.desbloqueado || !destino.desbloqueado) return;

    // Cálculo dinámico entre los nodos activos involucrados
    const dist = calcularDistanciaKm(origen.coordenadas, destino.coordenadas);
    const costoCarretera = Math.floor((150 + (dist * 40)) * 1000000); 

    if (state.dinero < costoCarretera) return;

    const nuevaConexion: Conexion = {
      id: `${desdeId}-${hastaId}`,
      desde: desdeId,
      hasta: hastaId,
      carriles: 1,
      costoConstruccion: costoCarretera
    };

    const alertaConexion: GameAlert = {
      id: crypto.randomUUID(),
      tipo: 'build',
      icono: '🛣️',
      mensaje: `Eje Vial Conectado`,
      microcopy: `Nueva autopista de ${origen.nombre} a ${destino.nombre} (${formatearDinero(costoCarretera)}).`
    };

    set((state) => ({
      dinero: state.dinero - costoCarretera,
      conexiones: [...state.conexiones, nuevaConexion],
      alertas: agregarAlertaUnica(alertaConexion)
    }));
  },

  intentarDesbloquearNodo: (id) => set((state) => {
    const nodo = state.municipios[id];
    if (!nodo || nodo.desbloqueado || state.llavesDeLaCiudad <= 0) return {};

    // FIFO para historial al activarse
    const nuevoHistorial = [id, ...state.ultimosNodosActivados.filter((x) => x !== id)].slice(0, 5);

    const alertaDesbloqueo: GameAlert = {
      id: crypto.randomUUID(),
      tipo: 'unlock',
      icono: '🔑',
      mensaje: `${nodo.nombre} Desbloqueado`,
      microcopy: "Expandiste con éxito las llaves de la ciudad a este municipio estratégico."
    };

    return {
      llavesDeLaCiudad: state.llavesDeLaCiudad - 1,
      alertas: agregarAlertaUnica(alertaDesbloqueo),
      ultimosNodosActivados: nuevoHistorial,
      municipios: { ...state.municipios, [id]: { ...nodo, desbloqueado: true, nivelActual: 1 } }
    };
  }),

  mejorarCarretera: (id) => set((state) => {
    const idx = state.conexiones.findIndex(c => c.id === id);
    if (idx === -1) return {};
    const conexion = state.conexiones[idx]!;

    const costo = conexion.costoConstruccion * 0.15; 
    if (state.dinero < costo || conexion.carriles >= 6) return {};

    const copias = [...state.conexiones];
    copias[idx] = { ...conexion, carriles: conexion.carriles + 1 };

    const alertaMejora: GameAlert = {
      id: crypto.randomUUID(),
      tipo: 'build',
      icono: '🛣️',
      mensaje: `Autopista Mejorada`,
      microcopy: `Ampliada a ${conexion.carriles + 1} carriles. Multiplicador de comercio regional sube a +80%.`
    };

    return {
      dinero: state.dinero - costo,
      conexiones: copias,
      alertas: agregarAlertaUnica(alertaMejora)
    };
  }),

  lanzarQuizPregunta: () => {
    const state = get();
    // Filtrar elegibles usando solo el historial FIFO de últimos 5 activos
    const nodosElegibles = state.ultimosNodosActivados.filter(id => {
      const m = state.municipios[id];
      return m && m.nivelActual > 0;
    });

    if (nodosElegibles.length === 0) return;

    const idRandom = nodosElegibles[Math.floor(Math.random() * nodosElegibles.length)]!;
    const ciudadRandom = state.municipios[idRandom]!;
    const datoRandom = ciudadRandom.datosCuriosos[Math.floor(Math.random() * ciudadRandom.datosCuriosos.length)]!;

    // Recompensa incrementada a 8.0x (4 veces la original de 2.0x)
    const proximasCiudades = Object.values(state.municipios).filter(m => !m.desbloqueado);
    const ciudadReferencia = proximasCiudades.length > 0
      ? proximasCiudades.reduce((prev, curr) => prev.precioBase < curr.precioBase ? prev : curr)
      : { precioBase: 500000000 };

    const recompensaCalculada = Math.floor(ciudadReferencia.precioBase * 8.0); 

    const distractores = Object.values(state.municipios)
      .filter(m => m.id !== ciudadRandom.id)
      .map(m => m.nombre);

    const opcionA = distractores[0] || "San Pedro Garza";
    const opcionB = distractores[1] || "Allende";

    const opcionesMezcladas = [ciudadRandom.nombre, opcionA, opcionB].sort(() => Math.random() - 0.5);
    const indexCorrecto = opcionesMezcladas.indexOf(ciudadRandom.nombre);

    set({
      quizActivo: {
        pregunta: `¿A qué municipio de tu historial activo pertenece este dato curioso?\n\n"${datoRandom}"`,
        opciones: opcionesMezcladas,
        indexCorrecto,
        recompensaEstimada: recompensaCalculada,
        nodoAsociadoId: idRandom
      }
    });
  },

  responderQuizPregunta: (indexSeleccionado) => {
    const state = get();
    const quiz = state.quizActivo;
    if (!quiz) return { exito: false, mensaje: "", microcopy: "" };

    const esCorrecto = indexSeleccionado === quiz.indexCorrecto;

    if (esCorrecto) {
      const alertaPremio: GameAlert = {
        id: crypto.randomUUID(),
        tipo: 'success',
        icono: '🧠',
        mensaje: '¡Trivia Superada con Éxito!',
        microcopy: `Recibiste un subsidio hacendario masivo de ${formatearDinero(quiz.recompensaEstimada)}.`
      };

      set((state) => ({
        dinero: state.dinero + quiz.recompensaEstimada,
        alertas: agregarAlertaUnica(alertaPremio)
      }));

      return {
        exito: true,
        mensaje: "¡Respuesta Correcta!",
        microcopy: `Ganaste ${formatearDinero(quiz.recompensaEstimada)} en fondos estatales.`
      };
    } else {
      // RESPUESTA INCORRECTA: Se desaloja este nodo del historial FIFO
      const nuevoHistorial = state.ultimosNodosActivados.filter(id => id !== quiz.nodoAsociadoId);

      const alertaReprobado: GameAlert = {
        id: crypto.randomUUID(),
        tipo: 'unlock',
        icono: '❌',
        mensaje: 'Estímulo Cancelado por Error',
        microcopy: `${state.municipios[quiz.nodoAsociadoId]?.nombre || 'El nodo'} fue desalojado del historial de trivias.`
      };

      set((state) => ({
        alertas: agregarAlertaUnica(alertaReprobado),
        ultimosNodosActivados: nuevoHistorial
      }));

      return {
        exito: false,
        mensaje: "Respuesta Incorrecta",
        microcopy: "El municipio ha sido removido del historial activo hasta que interactúes de nuevo con él."
      };
    }
  },

  cerrarQuiz: () => set({ quizActivo: null }),

  procesarSegundoJuego: () => set((state) => {
    let ingresosTotales = 0;
    Object.values(state.municipios).forEach((m) => {
      if (m.desbloqueado && m.nivelActual > 0) {
        // Multiplicador de población duplicado a 0.90 (antes 0.45) para jugar x2 más rápido
        const ingresoBaseNodo = m.poblacion * 0.90 * m.nivelActual; 

        // Filtrar puentes que tocan este nodo
        const puentesConectados = state.conexiones.filter(
          (c) => c.desde === m.id || c.hasta === m.id
        );

        // Bonificación de autopista incrementada a +80% por carril (antes 40%)
        const multiplicadorPuentes = 1 + puentesConectados.reduce(
          (acc, curr) => acc + (curr.carriles * 0.80),
          0
        );

        ingresosTotales += ingresoBaseNodo * multiplicadorPuentes;
      }
    });

    return { dinero: state.dinero + Math.floor(ingresosTotales) };
  })
}));