export interface ExerciseBackground {
  gradient: string[];
  country: string;
  description: string;
}

// Background gradients for different exercise categories
export const EXERCISE_BACKGROUNDS: Record<string, ExerciseBackground> = {
  breathing: {
    gradient: ['#FF6B6B', '#FFE66D'], // Warm sunset colors for Japan
    country: 'Japan',
    description: 'Ancient zen practices from Japanese temples',
  },
  meditation: {
    gradient: ['#667EEA', '#764BA2'], // Purple mountains for Tibet
    country: 'Tibet',
    description: 'Meditation techniques from Himalayan monks',
  },
  movement: {
    gradient: ['#F093FB', '#F5576C'], // Vibrant colors for India
    country: 'India',
    description: 'Traditional yoga practices from India',
  },
  water: {
    gradient: ['#4FACFE', '#00F2FE'], // Ocean blues for Hawaii
    country: 'Hawaii',
    description: 'Water-based relaxation from Pacific islands',
  },
  vocal: {
    gradient: ['#43E97B', '#38F9D7'], // Green tones for Sufi
    country: 'Persia',
    description: 'Vibrational healing from Sufi traditions',
  },
  default: {
    gradient: ['#30CFD0', '#330867'], // Universal cosmic gradient
    country: 'Universal',
    description: 'Timeless wellness practices from around the world',
  },
  // Additional tradition mappings
  china: {
    gradient: ['#FA709A', '#FEE140'], // Pink to yellow for China
    country: 'China',
    description: 'Ancient Qigong practices',
  },
  korea: {
    gradient: ['#A8EDEA', '#FED6E3'], // Soft blue to pink for Korea
    country: 'Korea',
    description: 'Traditional Sundo practices',
  },
  thailand: {
    gradient: ['#FF9A9E', '#FECFEF'], // Coral tones for Thailand
    country: 'Thailand',
    description: 'Ruesri Dat Ton stretching',
  },
  mongolia: {
    gradient: ['#4158D0', '#C850C0'], // Deep blue to purple for Mongolia
    country: 'Mongolia',
    description: 'Khoomei throat singing',
  },
  indonesia: {
    gradient: ['#0093E9', '#80D0C7'], // Ocean blues for Indonesia
    country: 'Indonesia',
    description: 'Tenaga Dalam energy work',
  },
  persia: {
    gradient: ['#FDBB2D', '#22C1C3'], // Gold to teal for Persia
    country: 'Persia',
    description: 'Zikr and whirling practices',
  },
  australia: {
    gradient: ['#E100FF', '#7F00FF'], // Purple tones for Australia
    country: 'Australia',
    description: 'Aboriginal healing practices',
  },
  africa: {
    gradient: ['#FF512F', '#DD2476'], // Warm reds for Africa
    country: 'Africa',
    description: 'Ubuntu and Yoruba traditions',
  },
  native_america: {
    gradient: ['#8E2DE2', '#4A00E0'], // Deep purples for Native America
    country: 'Native America',
    description: 'Medicine wheel ceremonies',
  },
  mexico: {
    gradient: ['#FF6B35', '#F72585'], // Orange to pink for Mexico
    country: 'Mexico',
    description: 'Aztec and Maya wisdom',
  },
  brazil: {
    gradient: ['#00C9FF', '#92FE9D'], // Green to blue for Brazil
    country: 'Brazil',
    description: 'Capoeira and Holotropic breath',
  },
  russia: {
    gradient: ['#FC466B', '#3F5EFB'], // Red to blue for Russia
    country: 'Russia',
    description: 'Systema Spetsnaz techniques',
  },
  scandinavia: {
    gradient: ['#74EBD5', '#ACB6E5'], // Cool blues for Scandinavia
    country: 'Scandinavia',
    description: 'Viking and Hygge practices',
  },
  greece: {
    gradient: ['#4E54C8', '#8F94FB'], // Blues for Greece
    country: 'Greece',
    description: 'Ancient Pneuma techniques',
  },
  netherlands: {
    gradient: ['#6190E8', '#A7BFE8'], // Light blues for Netherlands
    country: 'Netherlands',
    description: 'Wim Hof Method',
  },
  usa: {
    gradient: ['#3494E6', '#EC6EAD'], // Blue to pink for USA
    country: 'USA',
    description: 'Modern scientific approaches',
  },
};

// Helper function to get background for exercise
export const getExerciseBackground = (category?: string): ExerciseBackground => {
  const fallback: ExerciseBackground =
    EXERCISE_BACKGROUNDS.default ?? {
      gradient: ['#30CFD0', '#330867'],
      country: 'Universal',
      description: 'Timeless wellness practices from around the world',
    };

  if (!category) return fallback;

  const normalizedCategory = category.toLowerCase();
  return EXERCISE_BACKGROUNDS[normalizedCategory] ?? fallback;
};
