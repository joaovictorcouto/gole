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

  const vol = volume / 100;
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration + 0.05);
}

function playGota(volume: number) {
  // Realistic water drop: sharp pitch drop with a subtle ripple
  const ac = getCtx();
  const vol = (volume / 100) * 0.5;

  // Main "plop": fast pitch slide from high to low
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(2200, ac.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.12);
  gain1.gain.setValueAtTime(0, ac.currentTime);
  gain1.gain.linearRampToValueAtTime(vol, ac.currentTime + 0.002);
  gain1.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  osc1.start(ac.currentTime);
  osc1.stop(ac.currentTime + 0.3);

  // Ripple harmonic for body
  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(900, ac.currentTime + 0.02);
  osc2.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.18);
  gain2.gain.setValueAtTime(0, ac.currentTime + 0.02);
  gain2.gain.linearRampToValueAtTime(vol * 0.4, ac.currentTime + 0.04);
  gain2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  osc2.start(ac.currentTime + 0.02);
  osc2.stop(ac.currentTime + 0.4);

  // Tiny secondary droplet "tick"
  const osc3 = ac.createOscillator();
  const gain3 = ac.createGain();
  osc3.type = "sine";
  osc3.frequency.setValueAtTime(1600, ac.currentTime + 0.18);
  osc3.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.25);
  gain3.gain.setValueAtTime(0, ac.currentTime + 0.18);
  gain3.gain.linearRampToValueAtTime(vol * 0.2, ac.currentTime + 0.19);
  gain3.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.35);
  osc3.connect(gain3);
  gain3.connect(ac.destination);
  osc3.start(ac.currentTime + 0.18);
  osc3.stop(ac.currentTime + 0.4);
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
