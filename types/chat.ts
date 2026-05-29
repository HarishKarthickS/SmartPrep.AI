export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  model: string;
  systemPrompt?: string;
  temperature: number;
  isPinned?: boolean;
}

export interface UserSettings {
  apiKey: string;
  defaultModel: string;
  customModels: string[];
  theme: 'light' | 'dark' | 'system';
  fontSize: 'sm' | 'base' | 'lg';
  autoTitle: boolean;
  temperature: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  chatId?: string;
  messageId?: string;
  toolId?: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'source' | 'flashcards' | 'quiz';
  createdAt: number;
  updatedAt: number;
  tags: string[];
  sourceChatId?: string;
  metadata?: any;
}
