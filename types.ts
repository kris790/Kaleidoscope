
export enum UserTier {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO'
}

export interface Project {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  audioPrompt?: string;
  selectedVoice?: string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  createdAt: number;
  duration: number;
  resolution: string;
  style: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  tier: UserTier;
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

// Global declaration for AI Studio key management
declare global {
  /**
   * AIStudio interface for managing API keys in the host environment.
   * Defined globally to ensure compatibility with pre-configured types.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * AI Studio global object for key management.
     * Fix: Restored optional modifier to match the environment's base declaration 
     * and resolve "All declarations of 'aistudio' must have identical modifiers" error.
     */
    aistudio?: AIStudio;
  }
}