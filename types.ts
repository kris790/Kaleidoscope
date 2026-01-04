
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

export interface Project {
  id: string;
  title: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  audioPrompt?: string;
  selectedVoice?: string;
  thumbnailUrl?: string;
  createdAt: number;
  resolution: string;
  style: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  tier: UserTier;
  groundingSources?: GroundingSource[];
  clips: VideoClip[]; // Support for multiple clips/extensions
  audioUrl?: string;
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  promptSuffix: string;
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
