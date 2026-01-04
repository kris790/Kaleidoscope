
export enum UserTier {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface VideoClip {
  id: string;
  url: string;
  prompt: string;
  duration: number;
  apiObject: any;
  timestamp: number;
}

export interface SpeakerConfig {
  name: string;
  voiceId: string;
}

export interface Project {
  id: string;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  audioPrompt?: string;
  isMultiSpeaker?: boolean;
  speakers?: [SpeakerConfig, SpeakerConfig];
  selectedVoice?: string;
  cameraMovement?: string;
  thumbnailUrl?: string;
  createdAt: number;
  resolution: string;
  style: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  tier: UserTier;
  groundingSources?: GroundingSource[];
  clips: VideoClip[]; 
  audioUrl?: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  promptSuffix: string;
}

export interface CameraMovement {
  id: string;
  name: string;
  prompt: string;
}

export interface UserState {
  credits: number;
  tier: UserTier;
  projects: Project[];
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
