import Dexie, { type Table } from 'dexie';
import { ChatMessage, ChatSession } from '../../types/chat';

export interface DexieSession extends Omit<ChatSession, 'messages'> {
  // messages is stored in a separate table for performance
}

export interface DexieMessage extends ChatMessage {
  sessionId: string;
}

export interface DocumentChunk {
  id?: number;
  libraryItemId: string;
  content: string;
  embedding: number[];
  metadata?: any;
}

export class SmartPrepDB extends Dexie {
  sessions!: Table<DexieSession>;
  messages!: Table<DexieMessage>;
  documentChunks!: Table<DocumentChunk>;

  constructor() {
    super('SmartPrepDB');
    this.version(2).stores({
      sessions: 'id, title, model, createdAt, updatedAt, isPinned',
      messages: 'id, sessionId, timestamp',
      documentChunks: '++id, libraryItemId'
    });
  }
}

export const db = new SmartPrepDB();
