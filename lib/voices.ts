export interface VoiceInfo {
  id: string
  name: string
  gender: 'Male' | 'Female' | 'Neutral'
  description: string
  sampleUrl: string
}

// Voice configuration with gender identification
// Based on OpenAI's voice characteristics and common perception
export const VOICE_CONFIG: Record<string, VoiceInfo> = {
  alloy: {
    id: 'alloy',
    name: 'Alloy',
    gender: 'Neutral',
    description: 'Neutral, balanced voice',
    sampleUrl: '/audio/samples/alloy.mp3',
  },
  ash: {
    id: 'ash',
    name: 'Ash',
    gender: 'Male',
    description: 'Clear, professional male voice',
    sampleUrl: '/audio/samples/ash.mp3',
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    gender: 'Female',
    description: 'Warm, friendly female voice',
    sampleUrl: '/audio/samples/coral.mp3',
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    gender: 'Male',
    description: 'Deep, resonant male voice',
    sampleUrl: '/audio/samples/echo.mp3',
  },
  fable: {
    id: 'fable',
    name: 'Fable',
    gender: 'Female',
    description: 'Expressive, storytelling female voice',
    sampleUrl: '/audio/samples/fable.mp3',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    gender: 'Female',
    description: 'Modern, confident female voice',
    sampleUrl: '/audio/samples/nova.mp3',
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx',
    gender: 'Male',
    description: 'Strong, authoritative male voice',
    sampleUrl: '/audio/samples/onyx.mp3',
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    gender: 'Female',
    description: 'Calm, wise female voice',
    sampleUrl: '/audio/samples/sage.mp3',
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    gender: 'Female',
    description: 'Bright, energetic female voice',
    sampleUrl: '/audio/samples/shimmer.mp3',
  },
}

// Get all available voices as an array
export const VOICES = Object.keys(VOICE_CONFIG)

// Get voice info by ID
export const getVoiceInfo = (voiceId: string): VoiceInfo | undefined => {
  return VOICE_CONFIG[voiceId]
}

// Get voices by gender
export const getVoicesByGender = (gender: VoiceInfo['gender']) => {
  return Object.values(VOICE_CONFIG).filter(voice => voice.gender === gender)
}

// Get all voice options for dropdowns
export const getVoiceOptions = () => {
  return Object.values(VOICE_CONFIG).map(voice => ({
    value: voice.id,
    label: `${voice.name} (${voice.gender})`,
    gender: voice.gender,
    description: voice.description,
  }))
}