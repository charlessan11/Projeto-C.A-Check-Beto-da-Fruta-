import {
  CompletionTone,
  ReminderTone,
  SoundAlertSettings,
  StoreSettings,
} from '../types';

export const DEFAULT_SOUND_SETTINGS: SoundAlertSettings = {
  ativo: true,
  somConclusaoTarefa: true,
  tomConclusao: 'campainha',
  somLembreteRotina: true,
  tomLembrete: 'sino_suave',
  intervaloLembreteMinutos: 30,
  volume: 70,
};

export const COMPLETION_TONE_OPTIONS: {
  value: CompletionTone;
  label: string;
  description: string;
}[] = [
  {
    value: 'campainha',
    label: 'Campainha Suave (Padrão)',
    description: 'Toque clássico de campainha em dois tons acolhedores (Ding-Dong suave)',
  },
  {
    value: 'cristal',
    label: 'Toque de Cristal',
    description: 'Tríade cristalina ascendente leve e luminosa',
  },
  {
    value: 'harpa',
    label: 'Harpa Zen',
    description: 'Arpejo pentatônico sereno para conclusão tranquila',
  },
  {
    value: 'acorde',
    label: 'Acorde Harmônico',
    description: 'Acorde suave ressonante de confirmação imediata',
  },
];

export const REMINDER_TONE_OPTIONS: {
  value: ReminderTone;
  label: string;
  description: string;
}[] = [
  {
    value: 'sino_suave',
    label: 'Sino de Rotina Suave (Padrão)',
    description: 'Toque duplo calmo e harmônico para lembrar rotinas pendentes',
  },
  {
    value: 'pulso_zen',
    label: 'Pulso Acústico Zen',
    description: 'Dois toques suaves amadeirados que chamam atenção sem assustar',
  },
  {
    value: 'toque_discreto',
    label: 'Toque Discreto de Turno',
    description: 'Nota única sutil e breve para ambientes movimentados',
  },
];

export const REMINDER_INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: 'A cada 15 minutos' },
  { value: 30, label: 'A cada 30 minutos (Recomendado)' },
  { value: 45, label: 'A cada 45 minutos' },
  { value: 60, label: 'A cada 1 hora' },
  { value: 120, label: 'A cada 2 horas' },
];

export function getEffectiveSoundSettings(
  settings?: StoreSettings | null
): SoundAlertSettings {
  if (!settings || !settings.alertasSonoros) {
    return { ...DEFAULT_SOUND_SETTINGS };
  }
  return {
    ...DEFAULT_SOUND_SETTINGS,
    ...settings.alertasSonoros,
  };
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Helper to play a single soft bell/harmonic note with natural attack and exponential decay
 */
function playSoftNote(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  maxGain: number,
  type: OscillatorType = 'sine',
  overtoneRatio = 2,
  overtoneWeight = 0.18
) {
  const safeGain = Math.max(0.0001, Math.min(1, maxGain));

  // Main fundamental oscillator
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // Smooth attack (prevents click) and gentle bell-like exponential release
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(safeGain, startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);

  // Soft harmonic overtone for bell warmth
  if (overtoneWeight > 0) {
    const overOsc = ctx.createOscillator();
    const overGain = ctx.createGain();
    overOsc.type = 'triangle';
    overOsc.frequency.setValueAtTime(freq * overtoneRatio, startTime);

    overGain.gain.setValueAtTime(0.0001, startTime);
    overGain.gain.linearRampToValueAtTime(safeGain * overtoneWeight, startTime + 0.012);
    overGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.65);

    overOsc.connect(overGain);
    overGain.connect(ctx.destination);

    overOsc.start(startTime);
    overOsc.stop(startTime + duration * 0.65 + 0.02);
  }
}

/**
 * Plays a gentle chime when a task or routine is completed
 */
export function playTaskCompletionSound(
  settings?: StoreSettings | null,
  overrideTone?: CompletionTone,
  forcePlay = false
): void {
  try {
    const soundCfg = getEffectiveSoundSettings(settings);
    if (!forcePlay && (!soundCfg.ativo || !soundCfg.somConclusaoTarefa)) {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volumeScalar = Math.max(0.05, Math.min(1, (soundCfg.volume ?? 70) / 100)) * 0.28;
    const tone = overrideTone || soundCfg.tomConclusao || 'campainha';

    if (tone === 'campainha') {
      // Classic gentle service/store bell: bright Ding (G5) -> warm Dong (E5) -> soft C6 shimmer
      playSoftNote(ctx, 783.99, now, 0.55, volumeScalar, 'sine', 2, 0.22); // G5
      playSoftNote(ctx, 1046.5, now + 0.14, 0.85, volumeScalar * 0.95, 'sine', 2, 0.2); // C6
    } else if (tone === 'cristal') {
      // Ascending crystal chime: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        playSoftNote(ctx, freq, now + idx * 0.085, 0.65, volumeScalar * 0.85, 'sine', 3, 0.15);
      });
    } else if (tone === 'harpa') {
      // Zen pentatonic harp: D5 -> F#5 -> A5 -> D6
      const notes = [587.33, 739.99, 880.0, 1174.66];
      notes.forEach((freq, idx) => {
        playSoftNote(ctx, freq, now + idx * 0.095, 0.75, volumeScalar * 0.8, 'triangle', 2, 0.1);
      });
    } else if (tone === 'acorde') {
      // Warm major chord chime: C5 + E5 + G5 + B5
      const chord = [523.25, 659.25, 783.99, 987.77];
      chord.forEach((freq, idx) => {
        playSoftNote(
          ctx,
          freq,
          now + idx * 0.02,
          0.9,
          volumeScalar * 0.55,
          'sine',
          2,
          0.12
        );
      });
    }
  } catch (err) {
    console.warn('Não foi possível reproduzir o som de conclusão:', err);
  }
}

/**
 * Plays a gentle reminder sound for pending routines
 */
export function playRoutineReminderSound(
  settings?: StoreSettings | null,
  overrideTone?: ReminderTone,
  forcePlay = false
): void {
  try {
    const soundCfg = getEffectiveSoundSettings(settings);
    if (!forcePlay && (!soundCfg.ativo || !soundCfg.somLembreteRotina)) {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const volumeScalar = Math.max(0.05, Math.min(1, (soundCfg.volume ?? 70) / 100)) * 0.25;
    const tone = overrideTone || soundCfg.tomLembrete || 'sino_suave';

    if (tone === 'sino_suave') {
      // Calm double-tap singing bell: A4 (440Hz) -> E5 (659.25Hz) -> A5 (880Hz)
      playSoftNote(ctx, 528.0, now, 0.9, volumeScalar * 0.9, 'sine', 2.5, 0.14);
      playSoftNote(ctx, 792.0, now + 0.26, 1.15, volumeScalar * 0.85, 'sine', 2, 0.16);
    } else if (tone === 'pulso_zen') {
      // Gentle double marimba-like pulse: G4 -> D5 -> G5
      playSoftNote(ctx, 392.0, now, 0.35, volumeScalar * 0.95, 'triangle', 2, 0.08);
      playSoftNote(ctx, 587.33, now + 0.18, 0.45, volumeScalar * 0.9, 'triangle', 2, 0.08);
      playSoftNote(ctx, 783.99, now + 0.36, 0.65, volumeScalar * 0.85, 'sine', 2, 0.1);
    } else if (tone === 'toque_discreto') {
      // Subtle single harmonic chime: E5 -> B5
      playSoftNote(ctx, 659.25, now, 0.6, volumeScalar * 0.75, 'sine', 2, 0.1);
      playSoftNote(ctx, 987.77, now + 0.12, 0.65, volumeScalar * 0.65, 'sine', 2, 0.08);
    }
  } catch (err) {
    console.warn('Não foi possível reproduzir o som de lembrete de rotina:', err);
  }
}
