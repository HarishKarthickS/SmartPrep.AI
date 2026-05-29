import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Note, LibraryItem } from '../types/chat';

interface NotesState {
  notes: Note[];
  library: LibraryItem[];
  
  // Note actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  
  // Library actions
  addLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  deleteLibraryItem: (id: string) => void;
  
  // Reset all
  clearAllNotesAndLibrary: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      library: [],

      addNote: (note) => {
        const id = Math.random().toString(36).substring(2, 15);
        const newNote: Note = {
          ...note,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
        return id;
      },

      updateNote: (id, updatedFields) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id
              ? { ...n, ...updatedFields, updatedAt: Date.now() }
              : n
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      addLibraryItem: (item) => {
        const id = Math.random().toString(36).substring(2, 15);
        const newItem: LibraryItem = {
          ...item,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          library: [newItem, ...state.library],
        }));
        return id;
      },

      deleteLibraryItem: (id) =>
        set((state) => ({
          library: state.library.filter((item) => item.id !== id),
        })),

      clearAllNotesAndLibrary: () => set({ notes: [], library: [] }),
    }),
    {
      name: 'smartprep-notes',
      version: 1,
    }
  )
);
