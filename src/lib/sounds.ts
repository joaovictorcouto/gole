export type SoundPreset = "none" | "gota" | "ding" | "chime" | "suave" | "sino";

export const SOUND_OPTIONS: { id: SoundPreset; label: string; description: string }[] = [
  { id: "none",   label: "Nenhum",  description: "Sem som" },
  { id: "gota",   label: "Gota",    description: "Gota d'água suave" },
  { id: "ding",   label: "Ding",    description: "Toque leve e limpo" },
  { id: "chime",  label: "Chime",   description: "Sino cristalino" },
  { id: "suave",  label: "Suave",   description: "Pulso gentil" },
  { id: "sino",   label: "Sino",    description: "Sino minimalista" },
];

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function playEnvelope(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  attack = 0.005,
  freqEnd?: number,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ac.currentTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration);
  }

  // Escala quadrática para volume mais natural
  const scale = volume / 100;
  const vol = scale * scale;
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration + 0.05);
}

function playGota(volume: number) {
  // Som de gota realista com rampa de frequência ascendente
  const scale = volume / 100;
  const vol = scale * scale * 0.7;
  const ac = getCtx();

  // "Plop" principal: de 600Hz a 1500Hz
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(600, ac.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(1500, ac.currentTime + 0.12);
  gain1.gain.setValueAtTime(0, ac.currentTime);
  gain1.gain.linearRampToValueAtTime(vol, ac.currentTime + 0.005);
  gain1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  osc1.start(ac.currentTime);
  osc1.stop(ac.currentTime + 0.25);

  // Harmônico secundário curto e agudo para simular o destaque da gota
  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(1300, ac.currentTime + 0.08);
  osc2.frequency.exponentialRampToValueAtTime(1800, ac.currentTime + 0.16);
  gain2.gain.setValueAtTime(0, ac.currentTime + 0.08);
  gain2.gain.linearRampToValueAtTime(vol * 0.3, ac.currentTime + 0.09);
  gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.20);
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  osc2.start(ac.currentTime + 0.08);
  osc2.stop(ac.currentTime + 0.22);
}

function playDing(volume: number) {
  playEnvelope(1320, 0.6, volume * 0.8, "sine", 0.003);
  setTimeout(() => playEnvelope(1760, 0.4, volume * 0.4, "sine", 0.003), 60);
}

function playChime(volume: number) {
  playEnvelope(1047, 0.8, volume * 0.7, "sine", 0.005);
  setTimeout(() => playEnvelope(1319, 0.8, volume * 0.5, "sine", 0.005), 120);
  setTimeout(() => playEnvelope(1568, 0.7, volume * 0.4, "sine", 0.005), 260);
}

function playSuave(volume: number) {
  playEnvelope(660, 0.9, volume * 0.6, "sine", 0.08);
}

function playSino(volume: number) {
  playEnvelope(2093, 1.2, volume * 0.6, "sine", 0.003);
  setTimeout(() => playEnvelope(1047, 1.0, volume * 0.3, "sine", 0.003), 30);
}

export function playSound(preset: SoundPreset, volume: number) {
  if (preset === "none" || volume === 0) return;
  try {
    switch (preset) {
      case "gota":  playGota(volume);  break;
      case "ding":  playDing(volume);  break;
      case "chime": playChime(volume); break;
      case "suave": playSuave(volume); break;
      case "sino":  playSino(volume);  break;
    }
  } catch {
    // AudioContext not available — silently ignore
  }
}
