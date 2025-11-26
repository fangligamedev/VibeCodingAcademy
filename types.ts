export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED'
}

export type Language = 'en' | 'zh';

export interface LevelStep {
  id: number;
  instruction: string; // What the tutor wants the kid to do
  hint: string; // Hint for the prompt
  expectedAction: string; // Internal key to match visual state
  pythonSnippet: string; // The code that "would" be generated
}

export interface Level {
  id: number;
  worldId: number; // Which map this belongs to
  title: string;
  description: string;
  steps: LevelStep[];
  previewImage: string; // Placeholder URL
  maxStars: number;
}

export interface World {
  id: number;
  title: string;
  description: string;
  themeColor: string; // Tailwind color class prefix (e.g., 'indigo', 'red')
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  pythonCode?: string; // If the model generated code
  isCorrect?: boolean; // Did this message solve the step?
  visualAction?: string; // Action to trigger in the game view
}

export interface UserProgress {
  unlockedLevel: number; // Global distinct ID
  stars: Record<number, number>; // Level ID -> Stars earned
}