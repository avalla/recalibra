import { useState, useEffect, useCallback, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { logger } from '../utils/logger';
import { AppConfig } from '../config';

// Audio generation types
type NoiseType = 'pink' | 'brown' | 'white';

// Simple cache for generated audio URIs
const audioCache = new Map<string, string>();

// Seeded random for reproducible noise (makes seamless loops)
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate noise as WAV data URI with seamless loop
const generateNoiseDataUri = (
  noiseType: NoiseType, 
  durationMs: number = 30000, 
  sampleRate: number = 22050,
  filterFreq?: number
): string => {
  const samples = Math.floor(sampleRate * (durationMs / 1000));
  const crossfadeLength = Math.floor(sampleRate * 2); // 2 second crossfade for very smooth transition
  const totalSamples = samples;
  
  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + totalSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, totalSamples * 2, true);

  // Generate raw samples first
  const rawSamples = new Float32Array(samples + crossfadeLength);
  
  // Noise generation state
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let lastOut = 0;
  let seed = 12345; // Fixed seed for reproducibility

  // Simple low-pass filter coefficient
  const rc = filterFreq ? 1.0 / (2 * Math.PI * filterFreq) : 0;
  const dt = 1.0 / sampleRate;
  const alpha = filterFreq ? dt / (rc + dt) : 1;
  let filteredSample = 0;

  for (let i = 0; i < samples + crossfadeLength; i++) {
    seed++;
    const white = seededRandom(seed) * 2 - 1;
    let sample: number;

    switch (noiseType) {
      case 'pink':
        // Pink noise using Paul Kellet's algorithm
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        sample = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
        break;
      case 'brown':
        // Brown noise (random walk)
        sample = (lastOut + (0.02 * white)) / 1.02;
        lastOut = sample;
        sample *= 3.5; // Amplify
        break;
      case 'white':
      default:
        sample = white * 0.5;
        break;
    }

    // Apply low-pass filter if specified
    if (filterFreq) {
      filteredSample = filteredSample + alpha * (sample - filteredSample);
      sample = filteredSample;
    }

    rawSamples[i] = sample;
  }

  // Apply crossfade for seamless looping
  for (let i = 0; i < crossfadeLength; i++) {
    const fadeOut = 1 - (i / crossfadeLength); // End of main part fades out
    const fadeIn = i / crossfadeLength; // Beginning of extra part fades in
    
    // Mix the end with the beginning
    const endIdx = samples - crossfadeLength + i;
    const startIdx = i;
    
    rawSamples[endIdx] = rawSamples[endIdx] * fadeOut + rawSamples[samples + i] * fadeIn;
  }

  // Write to buffer (only the main samples, crossfaded)
  for (let i = 0; i < samples; i++) {
    const value = Math.floor(Math.max(-1, Math.min(1, rawSamples[i])) * 32767 * 0.4);
    view.setInt16(44 + i * 2, value, true);
  }

  const bytes = new Uint8Array(buffer);
  return `data:audio/wav;base64,${uint8ArrayToBase64(bytes)}`;
};

// Audio frequency presets for different exercises
export const AUDIO_PRESETS = {
  // Binaural beats (requires stereo headphones)
  binaural_alpha: {
    name: 'Alpha Waves',
    baseFrequency: 200,
    beatFrequency: 10, // 8-12 Hz for alpha state
    description: 'Relaxation & focus',
    benefits: 'Alpha waves (8-12 Hz) promote a relaxed but alert state. Ideal for reducing stress while maintaining focus. Use with headphones for best effect.',
  },
  binaural_theta: {
    name: 'Theta Waves',
    baseFrequency: 200,
    beatFrequency: 6, // 4-8 Hz for theta state
    description: 'Deep meditation',
    benefits: 'Theta waves (4-8 Hz) are associated with deep meditation, creativity, and REM sleep. Helps access subconscious insights and deep relaxation.',
  },
  binaural_delta: {
    name: 'Delta Waves',
    baseFrequency: 200,
    beatFrequency: 2, // 0.5-4 Hz for delta state
    description: 'Deep sleep',
    benefits: 'Delta waves (0.5-4 Hz) occur during deep, dreamless sleep. Promotes healing, regeneration, and immune system support.',
  },
  // Solfeggio frequencies
  solfeggio_396: {
    name: '396 Hz',
    frequency: 396,
    description: 'Liberation',
    benefits: 'The 396 Hz frequency helps liberate guilt and fear, turning grief into joy. Associated with the root chakra and grounding energy.',
  },
  solfeggio_432: {
    name: '432 Hz',
    frequency: 432,
    description: 'Harmony',
    benefits: '432 Hz is considered the natural frequency of the universe. Promotes harmony, calmness, and synchronization with nature\'s rhythms.',
  },
  solfeggio_528: {
    name: '528 Hz',
    frequency: 528,
    description: 'Transformation',
    benefits: 'Known as the "Love Frequency" or "Miracle Tone". Associated with DNA repair, transformation, and miracles. Promotes peace and clarity.',
  },
  solfeggio_639: {
    name: '639 Hz',
    frequency: 639,
    description: 'Connection',
    benefits: '639 Hz enhances communication, understanding, and tolerance in relationships. Promotes connection and harmony with others.',
  },
  // Om frequency
  om: {
    name: 'OM 136.1 Hz',
    frequency: 136.1,
    description: 'Earth frequency',
    benefits: '136.1 Hz is the frequency of OM, the cosmic vibration. It matches Earth\'s year cycle and promotes deep meditation and spiritual connection.',
  },
  // Nature sounds - generated procedurally
  nature_rain: {
    name: 'Rain',
    noiseType: 'pink' as NoiseType,
    description: 'Gentle rain',
    benefits: 'Rain sounds (pink noise) mask distracting sounds and promote relaxation. The consistent pattern helps calm the mind and improve focus.',
  },
  nature_ocean: {
    name: 'Ocean',
    noiseType: 'brown' as NoiseType,
    description: 'Ocean waves',
    benefits: 'Ocean waves provide deep, rhythmic sounds that naturally slow breathing and heart rate. The ebb and flow mimics natural breathing patterns.',
  },
  nature_forest: {
    name: 'Forest',
    noiseType: 'pink' as NoiseType,
    filterFreq: 2000,
    description: 'Forest ambience',
    benefits: 'Forest sounds connect you with nature, reducing stress hormones and promoting a sense of peace and well-being.',
  },
  // Tibetan instruments
  tibetan_bowl: {
    name: 'Singing Bowl',
    frequency: 396,
    description: 'Healing tones',
    benefits: 'Tibetan singing bowls produce rich, harmonic overtones that promote deep relaxation and balance the body\'s energy centers (chakras).',
    waveType: 'sine' as const,
    envelope: { attack: 2, decay: 3, sustain: 0.3, release: 4 },
  },
  tibetan_bells: {
    name: 'Tibetan Bells',
    frequency: 528,
    description: 'Bell tones',
    benefits: 'Crystal-clear bell tones help focus attention and mark transitions in meditation. The pure sound promotes mental clarity.',
    waveType: 'sine' as const,
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.2, release: 3 },
  },
  // Additional ambient sounds - generated procedurally
  wind: {
    name: 'Wind',
    noiseType: 'white' as NoiseType,
    filterFreq: 800,
    description: 'Soft breeze',
    benefits: 'Gentle wind sounds create a peaceful atmosphere and help release tension. The flowing quality encourages letting go of thoughts.',
  },
  creek: {
    name: 'Creek',
    noiseType: 'brown' as NoiseType,
    filterFreq: 1500,
    description: 'Flowing water',
    benefits: 'The sound of flowing water is universally calming. It promotes mental clarity and helps wash away stress and worry.',
  },
  // Additional healing frequencies
  solfeggio_741: {
    name: '741 Hz',
    frequency: 741,
    description: 'Intuition',
    benefits: '741 Hz awakens intuition and promotes self-expression. Helps cleanse cells from electromagnetic radiation and toxins.',
  },
  solfeggio_852: {
    name: '852 Hz',
    frequency: 852,
    description: 'Spiritual',
    benefits: '852 Hz returns to spiritual order and awakens inner strength. Helps see through illusions and reconnect with your true self.',
  },
  schumann: {
    name: 'Schumann 7.83 Hz',
    baseFrequency: 200,
    beatFrequency: 7.83,
    description: 'Earth resonance',
    benefits: '7.83 Hz is Earth\'s natural electromagnetic frequency. Promotes grounding, reduces stress, and helps synchronize with natural rhythms.',
  },
  // Silence
  silence: {
    name: 'Silence',
    description: 'Focus on breath',
    benefits: 'Pure silence allows you to focus entirely on your breath and inner experience. Recommended for advanced practitioners.',
  },
} as const;

export type AudioPresetKey = keyof typeof AUDIO_PRESETS;

// Audio recommendation based on exercise category and stress level
export type ExerciseCategory = 'breathing' | 'water' | 'movement' | 'sensory';

interface AudioRecommendation {
  primary: AudioPresetKey;
  alternatives: AudioPresetKey[];
  reason: string;
}

export const getAudioRecommendation = (
  category: ExerciseCategory,
  stressLevel: number // 1-9
): AudioRecommendation => {
  // Stress level buckets
  const isHighStress = stressLevel >= 7;
  const isMediumStress = stressLevel >= 4 && stressLevel < 7;
  const isLowStress = stressLevel < 4;

  // Recommendations by category and stress level
  const recommendations: Record<ExerciseCategory, Record<'high' | 'medium' | 'low', AudioRecommendation>> = {
    breathing: {
      high: {
        primary: 'nature_ocean',
        alternatives: ['binaural_delta', 'nature_rain', 'solfeggio_396'],
        reason: 'Ocean waves help slow your breathing and calm high stress',
      },
      medium: {
        primary: 'binaural_alpha',
        alternatives: ['solfeggio_432', 'nature_rain', 'tibetan_bowl'],
        reason: 'Alpha waves promote relaxed focus during breathing exercises',
      },
      low: {
        primary: 'binaural_theta',
        alternatives: ['om', 'solfeggio_528', 'silence'],
        reason: 'Theta waves deepen meditation when you\'re already calm',
      },
    },
    water: {
      high: {
        primary: 'nature_rain',
        alternatives: ['nature_ocean', 'creek', 'binaural_delta'],
        reason: 'Rain sounds mask stress and create a calming environment',
      },
      medium: {
        primary: 'creek',
        alternatives: ['nature_ocean', 'solfeggio_639', 'wind'],
        reason: 'Flowing water sounds complement cold exposure therapy',
      },
      low: {
        primary: 'nature_ocean',
        alternatives: ['silence', 'schumann', 'solfeggio_741'],
        reason: 'Ocean rhythms sync with your relaxed state',
      },
    },
    movement: {
      high: {
        primary: 'solfeggio_396',
        alternatives: ['nature_forest', 'wind', 'binaural_alpha'],
        reason: '396 Hz helps release physical tension during movement',
      },
      medium: {
        primary: 'nature_forest',
        alternatives: ['solfeggio_432', 'schumann', 'tibetan_bowl'],
        reason: 'Forest ambience connects you with natural movement rhythms',
      },
      low: {
        primary: 'solfeggio_528',
        alternatives: ['om', 'binaural_theta', 'silence'],
        reason: '528 Hz enhances transformation during mindful movement',
      },
    },
    sensory: {
      high: {
        primary: 'tibetan_bowl',
        alternatives: ['solfeggio_396', 'nature_rain', 'binaural_delta'],
        reason: 'Singing bowl tones ground and center when highly stressed',
      },
      medium: {
        primary: 'om',
        alternatives: ['tibetan_bells', 'solfeggio_639', 'binaural_alpha'],
        reason: 'OM frequency deepens sensory awareness',
      },
      low: {
        primary: 'solfeggio_852',
        alternatives: ['binaural_theta', 'tibetan_bells', 'silence'],
        reason: '852 Hz awakens spiritual awareness when relaxed',
      },
    },
  };

  const stressBucket = isHighStress ? 'high' : isMediumStress ? 'medium' : 'low';
  return recommendations[category][stressBucket];
};

interface UseAudioOptions {
  preset?: AudioPresetKey;
  volume?: number;
  loop?: boolean;
}

// Base64 encoding for React Native (btoa is not available)
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;
    
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < len ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < len ? chars[c & 63] : '=';
  }
  
  return result;
};

// Generate a seamless looping sine wave tone as a WAV data URI (MONO)
// Using 16000 Hz sample rate - sufficient for frequencies up to 8kHz, much smaller file size
const generateToneDataUri = (frequency: number, durationMs: number = 20000, sampleRate: number = 16000): string => {
  // Create cache key
  const cacheKey = `tone_${frequency}_${durationMs}_${sampleRate}`;
  
  // Check cache first
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const samples = Math.floor(sampleRate * (durationMs / 1000));
  const crossfadeLength = Math.floor(sampleRate * 1); // 1 second crossfade
  
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, 1, true); // NumChannels (mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, samples * 2, true);

  // Generate raw samples first
  const rawSamples = new Float32Array(samples + crossfadeLength);
  for (let i = 0; i < samples + crossfadeLength; i++) {
    const t = i / sampleRate;
    rawSamples[i] = Math.sin(2 * Math.PI * frequency * t);
  }

  // Apply crossfade for seamless looping
  for (let i = 0; i < crossfadeLength; i++) {
    const fadeOut = 1 - (i / crossfadeLength);
    const fadeIn = i / crossfadeLength;
    const endIdx = samples - crossfadeLength + i;
    rawSamples[endIdx] = rawSamples[endIdx] * fadeOut + rawSamples[samples + i] * fadeIn;
  }

  // Write to buffer
  for (let i = 0; i < samples; i++) {
    const value = Math.floor(rawSamples[i] * 32767 * 0.4);
    view.setInt16(44 + i * 2, value, true);
  }

  // Convert to base64 using React Native compatible method
  const bytes = new Uint8Array(buffer);
  const uri = `data:audio/wav;base64,${uint8ArrayToBase64(bytes)}`;
  
  // Cache the result
  audioCache.set(cacheKey, uri);
  
  // Limit cache size to prevent memory issues
  if (audioCache.size > 15) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) {
      audioCache.delete(firstKey);
    }
  }
  
  return uri;
};

/**
 * Generate STEREO binaural beats as WAV data URI
 * Left channel: baseFrequency
 * Right channel: baseFrequency + beatFrequency
 * The brain perceives the difference as the "beat" frequency
 * 
 * Example: base=200Hz, beat=10Hz
 * - Left ear: 200 Hz sine wave
 * - Right ear: 210 Hz sine wave
 * - Brain perceives: 10 Hz alpha wave
 */
const generateBinauralDataUri = (
  baseFrequency: number,
  beatFrequency: number,
  durationMs: number = 60000,
  sampleRate: number = 22050
): string => {
  // Create cache key
  const cacheKey = `binaural_${baseFrequency}_${beatFrequency}_${durationMs}_${sampleRate}`;
  
  // Check cache first
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const samples = Math.floor(sampleRate * (durationMs / 1000));
  const crossfadeLength = Math.floor(sampleRate * 2); // 2 second crossfade for smooth loop
  
  // STEREO: 2 channels, 2 bytes per sample = 4 bytes per frame
  const numChannels = 2;
  const bytesPerSample = 2;
  const dataSize = samples * numChannels * bytesPerSample;
  
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header helper
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // WAV header for STEREO
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM)
  view.setUint16(22, numChannels, true); // NumChannels (STEREO = 2)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
  view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Calculate frequencies for each ear
  const leftFreq = baseFrequency;
  const rightFreq = baseFrequency + beatFrequency;

  // Generate raw samples for both channels
  const leftSamples = new Float32Array(samples + crossfadeLength);
  const rightSamples = new Float32Array(samples + crossfadeLength);

  for (let i = 0; i < samples + crossfadeLength; i++) {
    const t = i / sampleRate;
    leftSamples[i] = Math.sin(2 * Math.PI * leftFreq * t);
    rightSamples[i] = Math.sin(2 * Math.PI * rightFreq * t);
  }

  // Apply crossfade for seamless looping on both channels
  for (let i = 0; i < crossfadeLength; i++) {
    const fadeOut = 1 - (i / crossfadeLength);
    const fadeIn = i / crossfadeLength;
    const endIdx = samples - crossfadeLength + i;
    
    leftSamples[endIdx] = leftSamples[endIdx] * fadeOut + leftSamples[samples + i] * fadeIn;
    rightSamples[endIdx] = rightSamples[endIdx] * fadeOut + rightSamples[samples + i] * fadeIn;
  }

  // Write interleaved stereo data (L, R, L, R, ...)
  for (let i = 0; i < samples; i++) {
    const leftValue = Math.floor(leftSamples[i] * 32767 * 0.4);
    const rightValue = Math.floor(rightSamples[i] * 32767 * 0.4);
    
    // Left channel
    view.setInt16(44 + i * 4, leftValue, true);
    // Right channel
    view.setInt16(44 + i * 4 + 2, rightValue, true);
  }

  const bytes = new Uint8Array(buffer);
  return `data:audio/wav;base64,${uint8ArrayToBase64(bytes)}`;
};

// Dual player seamless loop system
const AUDIO_DURATION_MS = 60000; // 60 seconds per clip
const CROSSFADE_START_MS = 55000; // Start crossfade 5 seconds before end
const CROSSFADE_DURATION_MS = AppConfig.AUDIO_CROSSFADE_DURATION; // Configurable crossfade duration
const POSITION_CHECK_INTERVAL = AppConfig.AUDIO_CROSSFADE_DURATION / 10; // Check position every 10th of crossfade duration

export const useAudio = (options: UseAudioOptions = {}) => {
  const { preset = 'silence', volume = AppConfig.AUDIO_DEFAULT_VOLUME } = options;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  
  // Dual player refs for seamless crossfade
  const playerARef = useRef<AudioPlayer | null>(null);
  const playerBRef = useRef<AudioPlayer | null>(null);
  const activePlayerRef = useRef<'A' | 'B'>('A');
  const isCrossfadingRef = useRef(false);
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const volumeRef = useRef(volume);

  // Update volume ref when prop changes
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Generate audio source based on preset
  useEffect(() => {
    // Stop and release old players when preset changes
    try {
      if (playerARef.current) {
        playerARef.current.pause();
        playerARef.current.release();
        playerARef.current = null;
      }
      if (playerBRef.current) {
        playerBRef.current.pause();
        playerBRef.current.release();
        playerBRef.current = null;
      }
    } catch (e) {
      logger.error('Error cleaning up old players', e as Error, 'useAudio');
    }
    setIsPlaying(false);
    activePlayerRef.current = 'A';
    
    const presetConfig = AUDIO_PRESETS[preset];
    
    if (!presetConfig || preset === 'silence') {
      setAudioUri(null);
      setIsLoaded(false);
      return;
    }

    let source: string | null = null;

    if ('noiseType' in presetConfig && presetConfig.noiseType) {
      // Nature sounds - use noise generator
      const filterFreq = 'filterFreq' in presetConfig ? presetConfig.filterFreq : undefined;
      source = generateNoiseDataUri(presetConfig.noiseType as NoiseType, AUDIO_DURATION_MS, 16000, filterFreq as number | undefined);
    } else if ('baseFrequency' in presetConfig && 'beatFrequency' in presetConfig && presetConfig.beatFrequency) {
      // Binaural beats - use STEREO generator with different frequencies per ear
      // Left ear: baseFrequency, Right ear: baseFrequency + beatFrequency
      source = generateBinauralDataUri(
        presetConfig.baseFrequency,
        presetConfig.beatFrequency,
        AUDIO_DURATION_MS
      );
    } else if ('frequency' in presetConfig && presetConfig.frequency) {
      // Pure tones (Solfeggio, OM, Tibetan) - mono sine wave
      source = generateToneDataUri(presetConfig.frequency, AUDIO_DURATION_MS);
    }

    // Clean up cache when changing presets to prevent memory leaks
    if (source) {
      // Keep cache size manageable
      if (audioCache.size > 20) {
        // Remove oldest entries
        const keysToRemove = Array.from(audioCache.keys()).slice(0, 5);
        keysToRemove.forEach(key => audioCache.delete(key));
      }
    }

    if (source) {
      setAudioUri(source);
      setIsLoaded(true);
    }
  }, [preset]);

  // Create a new sound instance
  const createSound = useCallback(async (uri: string): Promise<AudioPlayer | null> => {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
      });
      const player = createAudioPlayer(uri);
      player.volume = volumeRef.current;
      return player;
    } catch (error) {
      logger.error('Failed to create sound', error as Error, 'useAudio');
      return null;
    }
  }, []);

  // Crossfade from current player to next
  const performCrossfade = useCallback(async () => {
    if (isCrossfadingRef.current || !audioUri) return;
    isCrossfadingRef.current = true;

    try {
      const currentPlayer = activePlayerRef.current === 'A' ? playerARef.current : playerBRef.current;
      const nextPlayerRef = activePlayerRef.current === 'A' ? playerBRef : playerARef;
      
      // Verifica che il player corrente esista ancora
      if (!currentPlayer) {
        isCrossfadingRef.current = false;
        return;
      }

      // Create new sound for next player
      const newSound = await createSound(audioUri);
      if (!newSound) {
        isCrossfadingRef.current = false;
        return;
      }

      // Release old next player if exists
      if (nextPlayerRef.current) {
        try {
          nextPlayerRef.current.release();
        } catch (e) {
          logger.error('Error releasing player', e as Error, 'useAudio');
        }
      }
      nextPlayerRef.current = newSound;

      // Start next player at volume 0
      newSound.volume = 0;
      newSound.play();

      // Gradual crossfade over CROSSFADE_DURATION_MS
      const steps = 20;
      const stepDuration = CROSSFADE_DURATION_MS / steps;
      
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const fadeOutVol = volumeRef.current * (1 - progress);
        const fadeInVol = volumeRef.current * progress;
        
        try {
          if (currentPlayer) currentPlayer.volume = fadeOutVol;
          newSound.volume = fadeInVol;
        } catch (e) {
          // Player potrebbe essere stato rilasciato
          logger.warn('Player may have been released during crossfade', 'useAudio');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }

      // Stop old player
      try {
        if (currentPlayer) {
          currentPlayer.pause();
        }
      } catch (e) {
        logger.error('Error stopping old player', e as Error, 'useAudio');
      }

      // Switch active player
      activePlayerRef.current = activePlayerRef.current === 'A' ? 'B' : 'A';
    } catch (error) {
      logger.error('Crossfade error', error as Error, 'useAudio');
    } finally {
      isCrossfadingRef.current = false;
    }
  }, [audioUri, createSound]);

  // Monitor position and trigger crossfade
  const startPositionMonitor = useCallback(() => {
    if (positionIntervalRef.current) return;

    positionIntervalRef.current = setInterval(() => {
      const activePlayer = activePlayerRef.current === 'A' ? playerARef.current : playerBRef.current;
      if (!activePlayer || isCrossfadingRef.current) return;

      try {
        const positionMs = activePlayer.currentTime * 1000;
        if (positionMs >= CROSSFADE_START_MS) {
          performCrossfade();
        }
      } catch (e) {
        // Player might be released
      }
    }, POSITION_CHECK_INTERVAL);
  }, [performCrossfade]);

  const stopPositionMonitor = useCallback(() => {
    if (positionIntervalRef.current) {
      clearInterval(positionIntervalRef.current);
      positionIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPositionMonitor();
      try {
        playerARef.current?.release();
      } catch (e) {
        // ignore - native object might already be gone
      } finally {
        playerARef.current = null;
      }

      try {
        playerBRef.current?.release();
      } catch (e) {
        // ignore - native object might already be gone
      } finally {
        playerBRef.current = null;
      }
    };
  }, [stopPositionMonitor]);

  const play = useCallback(async () => {
    if (!audioUri) return;

    try {
      // Create initial sound if needed
      if (!playerARef.current) {
        playerARef.current = await createSound(audioUri);
      }

      const player = activePlayerRef.current === 'A' ? playerARef.current : playerBRef.current;
      if (player) {
        player.volume = volumeRef.current;
        player.play();
        setIsPlaying(true);
        startPositionMonitor();
      }
    } catch (error) {
      logger.error('Error playing audio', error as Error, 'useAudio');
      setIsPlaying(false);
    }
  }, [audioUri, createSound, startPositionMonitor]);

  const pause = useCallback(() => {
    stopPositionMonitor();
    try {
      const player = activePlayerRef.current === 'A' ? playerARef.current : playerBRef.current;
      if (player) {
        player.pause();
      }
    } catch (e) {
      logger.error('Error pausing', e as Error, 'useAudio');
    }
    setIsPlaying(false);
  }, [stopPositionMonitor]);

  const stop = useCallback(() => {
    stopPositionMonitor();
    isCrossfadingRef.current = false;
    
    try {
      if (playerARef.current) {
        playerARef.current.pause();
        playerARef.current.seekTo(0);
      }
    } catch (e) {
      // Player may not be in a valid state
      logger.error('Error stopping player A', e as Error, 'useAudio');
      playerARef.current = null;
    }
    
    try {
      if (playerBRef.current) {
        playerBRef.current.pause();
        playerBRef.current.release();
        playerBRef.current = null;
      }
    } catch (e) {
      // Player may not be in a valid state
      logger.error('Error stopping player B', e as Error, 'useAudio');
      playerBRef.current = null;
    }
    
    activePlayerRef.current = 'A';
    setIsPlaying(false);
  }, [stopPositionMonitor]);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const vol = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = vol;
    
    const player = activePlayerRef.current === 'A' ? playerARef.current : playerBRef.current;
    if (player && !isCrossfadingRef.current) {
      player.volume = vol;
    }
  }, []);

  return {
    isPlaying,
    isLoaded,
    play,
    pause,
    stop,
    setVolume: setVolumeLevel,
    presetInfo: AUDIO_PRESETS[preset],
  };
};
