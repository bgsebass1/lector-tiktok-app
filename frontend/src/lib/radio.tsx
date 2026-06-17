import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export interface Station {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  stream: string;
}

/** Estaciones temáticas (audio vía SomaFM, listener-supported). */
export const STATIONS: Station[] = [
  { id: "paris", name: "Café de París", desc: "Jazz lounge para escribir", emoji: "🎷", stream: "https://ice1.somafm.com/secretagent-128-mp3" },
  { id: "alejandria", name: "Biblioteca de Alejandría", desc: "Clásica y ambient", emoji: "📜", stream: "https://ice1.somafm.com/dronezone-128-mp3" },
  { id: "tormenta", name: "Tormenta rusa", desc: "Oscuro y envolvente", emoji: "🌩️", stream: "https://ice1.somafm.com/doomed-128-mp3" },
  { id: "roma", name: "Mañana en Roma", desc: "Cálido y soñador", emoji: "🏛️", stream: "https://ice1.somafm.com/lush-128-mp3" },
  { id: "bosque", name: "Bosque de Heidegger", desc: "Ambient profundo", emoji: "🌲", stream: "https://ice1.somafm.com/deepspaceone-128-mp3" },
  { id: "mar", name: "Mar de Lampedusa", desc: "Chill sereno", emoji: "🌊", stream: "https://ice1.somafm.com/groovesalad-128-mp3" },
];

interface RadioCtx {
  current: Station | null;
  playing: boolean;
  play: (s: Station) => void;
  toggle: () => void;
  stop: () => void;
}
const Ctx = createContext<RadioCtx>({ current: null, playing: false, play: () => {}, toggle: () => {}, stop: () => {} });

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Station | null>(null);
  const [playing, setPlaying] = useState(false);

  function audio() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
    }
    return audioRef.current;
  }

  function play(s: Station) {
    const a = audio();
    if (current?.id !== s.id) {
      a.src = s.stream;
      setCurrent(s);
    }
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  function toggle() {
    const a = audioRef.current;
    if (!a || !current) return;
    if (playing) { a.pause(); setPlaying(false); }
    else a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }
  function stop() {
    audioRef.current?.pause();
    setPlaying(false);
    setCurrent(null);
  }

  return <Ctx.Provider value={{ current, playing, play, toggle, stop }}>{children}</Ctx.Provider>;
}

export const useRadio = () => useContext(Ctx);
