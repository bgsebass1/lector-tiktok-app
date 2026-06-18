/**
 * Taller de escritura de 60 días (esqueleto curricular).
 * Cada día tiene tema, foco y un breve; la teoría + ejercicio detallados los
 * genera la IA bajo demanda. Cada día múltiplo de 7 es un PROYECTO semanal.
 * Dificultad progresiva; combina narrativa, ensayo, filosofía y observación.
 */
export interface CourseDay {
  day: number;
  week: number;
  title: string;
  brief: string;
  /** Destrezas que trabaja (de las 5 del taller). */
  skills: string[];
  project?: boolean;
}

export const WEEK_TITLES: Record<number, string> = {
  1: "Ver el mundo: observación y claridad",
  2: "La frase: ritmo, concisión y precisión",
  3: "Narrar: escena, acción y diálogo",
  4: "La voz: punto de vista y tono",
  5: "Pensar por escrito: el ensayo",
  6: "El abismo: profundidad filosófica",
  7: "Imaginar: originalidad y lo fantástico",
  8: "Tu estilo: revisión y voz propia",
  9: "Integración: tu obra",
};

const C = (day: number, title: string, brief: string, skills: string[], project = false): CourseDay => ({
  day,
  week: Math.min(9, Math.ceil(day / 7)),
  title,
  brief,
  skills,
  project,
});

export const COURSE: CourseDay[] = [
  // Semana 1 — Observación y claridad
  C(1, "Mirar de verdad", "Describir un objeto cotidiano sin nombrarlo, solo por lo que ves.", ["observación", "claridad"]),
  C(2, "El detalle concreto", "Lo universal vive en lo particular. Un solo detalle que lo diga todo.", ["observación", "estilo"]),
  C(3, "La frase clara", "Escribir una idea compleja en una frase limpia. Orwell y la prosa como vidrio.", ["claridad"]),
  C(4, "Verbos, no adjetivos", "Mostrar con acción. Cortar la grasa adjetival.", ["claridad", "estilo"]),
  C(5, "El cuaderno del observador", "Registrar tres escenas reales del día con precisión sensorial.", ["observación"]),
  C(6, "Lo que no se dice", "El silencio y la elipsis. Sugerir en vez de explicar (Chéjov, Hemingway).", ["estilo", "profundidad"]),
  C(7, "PROYECTO: Retrato de un lugar", "Un texto de 400 palabras que haga ver un lugar real que conoces.", ["observación", "claridad", "estilo"], true),

  // Semana 2 — La frase
  C(8, "Ritmo y respiración", "Frases largas y cortas. La música de la prosa.", ["estilo"]),
  C(9, "Economía", "Decir más con menos. Tachar la mitad sin perder sentido.", ["claridad", "estilo"]),
  C(10, "La cadencia de Borges", "Precisión y elegancia. Analizar y emular una frase borgesiana.", ["estilo", "originalidad"]),
  C(11, "Concreto vs abstracto", "Bajar las ideas abstractas a imágenes tocables.", ["claridad", "observación"]),
  C(12, "El comienzo", "La primera frase que obliga a seguir leyendo.", ["originalidad", "estilo"]),
  C(13, "El final", "Cerrar con resonancia, no con resumen.", ["estilo", "profundidad"]),
  C(14, "PROYECTO: Una escena en 300 palabras", "Una escena con tensión, sin una sola palabra de sobra.", ["claridad", "estilo"], true),

  // Semana 3 — Narrar
  C(15, "Mostrar, no contar", "Convertir una afirmación en una escena.", ["estilo", "observación"]),
  C(16, "La escena", "Tiempo, espacio y acción. El presente vivo del relato.", ["claridad", "estilo"]),
  C(17, "El diálogo", "Hablar como hablan las personas, pero mejor. Subtexto.", ["observación", "originalidad"]),
  C(18, "El conflicto", "Todo relato es deseo contra obstáculo.", ["profundidad"]),
  C(19, "El personaje por el gesto", "Revelar a alguien por un solo acto (Tolstói, el detalle moral).", ["observación", "profundidad"]),
  C(20, "El tiempo narrativo", "Resumen, escena y elipsis: manejar la velocidad.", ["estilo", "claridad"]),
  C(21, "PROYECTO: Cuento mínimo", "Un relato completo de 500 palabras con conflicto y giro.", ["originalidad", "estilo", "profundidad"], true),

  // Semana 4 — La voz
  C(22, "Punto de vista", "Primera, segunda, tercera. Quién ve y qué sabe.", ["estilo", "claridad"]),
  C(23, "La distancia narrativa", "Acercar y alejar la cámara de la mente del personaje.", ["estilo"]),
  C(24, "El narrador no fiable", "Cuando quien cuenta miente o se engaña (Dostoyevski, el subsuelo).", ["originalidad", "profundidad"]),
  C(25, "Tono", "Irónico, solemne, íntimo. El tono como decisión.", ["estilo", "originalidad"]),
  C(26, "La voz de Cortázar", "Coloquialidad y juego. Romper la sintaxis con intención.", ["originalidad", "estilo"]),
  C(27, "Escribir desde otro", "Encarnar una conciencia ajena a la tuya.", ["observación", "profundidad"]),
  C(28, "PROYECTO: La misma escena en tres voces", "Un mismo hecho narrado por tres conciencias distintas.", ["estilo", "originalidad"], true),

  // Semana 5 — El ensayo
  C(29, "Pensar por escrito", "El ensayo como aventura del pensamiento (Montaigne, Orwell).", ["claridad", "profundidad"]),
  C(30, "La tesis", "Una idea defendible y por qué importa.", ["claridad"]),
  C(31, "El ejemplo", "Aterrizar una idea con un caso concreto y vivido.", ["observación", "claridad"]),
  C(32, "La digresión con rumbo", "Desviarse sin perderse: el arte del paréntesis.", ["originalidad", "estilo"]),
  C(33, "Pensar contra uno mismo", "Anticipar la objeción más fuerte a tu idea.", ["profundidad", "claridad"]),
  C(34, "Política y lenguaje", "Orwell: cómo el lenguaje turbio esconde pensamiento turbio.", ["claridad", "profundidad"]),
  C(35, "PROYECTO: Ensayo breve", "800 palabras defendiendo una idea propia con rigor y voz.", ["claridad", "profundidad", "estilo"], true),

  // Semana 6 — Profundidad filosófica
  C(36, "El absurdo", "Camus y Sísifo: escribir sobre el sentido sin moralejas.", ["profundidad", "originalidad"]),
  C(37, "La culpa y la conciencia", "Dostoyevski: el alma dividida.", ["profundidad"]),
  C(38, "Lo kafkiano", "La angustia de lo inexplicable y burocrático.", ["originalidad", "profundidad"]),
  C(39, "El tiempo y la memoria", "Escribir el paso del tiempo (Proust, el instante).", ["profundidad", "estilo"]),
  C(40, "La muerte como tema", "Mirar de frente lo que evitamos, sin sentimentalismo.", ["profundidad", "observación"]),
  C(41, "La idea encarnada", "Convertir un concepto filosófico en una escena concreta.", ["profundidad", "originalidad"]),
  C(42, "PROYECTO: Relato filosófico", "Un cuento que piense una idea sin explicarla.", ["profundidad", "originalidad", "estilo"], true),

  // Semana 7 — Imaginar
  C(43, "Lo fantástico", "La grieta de lo imposible en lo real (Borges, Cortázar).", ["originalidad"]),
  C(44, "El realismo mágico", "García Márquez: lo extraordinario contado con naturalidad.", ["originalidad", "estilo"]),
  C(45, "La metáfora viva", "Crear imágenes que piensan, no que decoran.", ["originalidad", "estilo"]),
  C(46, "Estructuras no lineales", "Laberintos, espejos, círculos: la forma como sentido.", ["originalidad", "profundidad"]),
  C(47, "El 'qué pasaría si'", "Una premisa imposible llevada con lógica implacable.", ["originalidad", "claridad"]),
  C(48, "Reescribir un mito", "Tomar un mito o cuento clásico y torcerlo.", ["originalidad", "profundidad"]),
  C(49, "PROYECTO: Cuento original", "Un relato fantástico con su propia lógica interna.", ["originalidad", "estilo", "profundidad"], true),

  // Semana 8 — Tu estilo
  C(50, "Matar a tus tesoros", "Cortar lo que más te gusta si no sirve al texto.", ["estilo", "claridad"]),
  C(51, "El detalle revelador", "Chéjov: el objeto que carga todo el peso emocional.", ["observación", "estilo"]),
  C(52, "Revisión profunda", "Leer en voz alta y cazar lo falso.", ["estilo", "claridad"]),
  C(53, "Tu obsesión", "Identificar los temas que vuelven en lo que escribes.", ["profundidad", "originalidad"]),
  C(54, "Imitar para liberarse", "Copiar a un maestro para luego dejarlo.", ["estilo", "originalidad"]),
  C(55, "La sinceridad", "Escribir lo que de verdad piensas, aunque incomode.", ["profundidad", "originalidad"]),
  C(56, "PROYECTO: Texto pulido", "Reescribir hasta el hueso un texto tuyo anterior.", ["estilo", "claridad", "profundidad"], true),

  // Semana 9 — Integración
  C(57, "Planear una obra", "Mapa de un texto largo que combine todo lo aprendido.", ["claridad", "profundidad"]),
  C(58, "Escribir el borrador", "Lanzarse al texto largo sin censura.", ["estilo", "originalidad", "profundidad"]),
  C(59, "Editar la obra", "Recortar, ordenar, afinar la voz.", ["estilo", "claridad"]),
  C(60, "Manifiesto de tu voz", "Declarar qué clase de escritor eres y por qué escribes.", ["originalidad", "profundidad", "estilo"], true),
];

/** Las 5 destrezas que el taller desarrolla y con las que se evalúa. */
export const SKILLS = ["claridad", "observacion", "originalidad", "profundidad", "estilo"] as const;
