'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  Download,
  Tag,
  Check,
  Calendar,
  X,
  BookOpen,
  ChevronLeft,
  Pin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../../types/chat';
import { useNotesStore } from '../../stores/notes-store';
import { useChatStore } from '../../stores/chat-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';
import { fadeUp, staggerContainer, hoverScale, springTransition } from '../../lib/utils/animations';

export const NotesBoard: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const { activeSessionId, attachContext, detachContext, sessions } = useChatStore();
  const { showToast } = useToastStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const activeNote = notes.find((n) => n.id === activeNoteId);
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const isPinned = activeNoteId ? activeSession?.attachedContexts?.some(c => c.type === 'note' && c.id === activeNoteId) : false;

  const togglePin = () => {
    if (!activeSessionId || !activeNoteId) return;
    if (isPinned) {
      detachContext(activeSessionId, 'note', activeNoteId);
      showToast('Detached', 'info', 'Note removed from chat context.');
    } else {
      attachContext(activeSessionId, 'note', activeNoteId);
      showToast('Attached', 'success', 'Note pinned to chat context.');
    }
  };

  const handleCreateNote = () => {
    const id = addNote({
      title: 'New Study Note',
      content: '# New Study Note\n\nStart compiling your reference guides here...',
      tags: ['general'],
    });
    setActiveNoteId(id);
    // Fetch latest state directly to avoid stale closure
    const newNote = useNotesStore.getState().notes.find((n) => n.id === id);
    if (newNote) startEditingNote(newNote);
  };

  const startEditingNote = (n: Note) => {
    setEditTitle(n.title);
    setEditContent(n.content);
    setEditTags(n.tags.join(', '));
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!activeNoteId) return;
    if (!editTitle.trim()) {
      showToast('Title required', 'error', 'Note title cannot be blank.');
      return;
    }
    const tagsArray = editTags.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
    updateNote(activeNoteId, { title: editTitle.trim(), content: editContent, tags: tagsArray });
    setIsEditing(false);
    showToast('Saved', 'success', 'Study note updated.');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    const remaining = notes.filter((n) => n.id !== id);
    if (activeNoteId === id) {
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      setIsEditing(false);
    }
    showToast('Deleted', 'info', 'Note removed.');
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeNote ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 pl-6 pr-14 flex items-center justify-between flex-shrink-0 border-b border-border/40 bg-background/50 backdrop-blur-md">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-[14px] font-bold text-foreground tracking-tight truncate">Notes</h2>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNote}
                className="h-9 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-none flex items-center justify-center"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                <span>Create</span>
              </Button>
            </div>

            <div className="p-4 space-y-4 border-b border-border/20">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-secondary border border-border/40 rounded-xl pl-10 pr-3 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              {allTags.length > 0 && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      !selectedTag ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground/60 hover:text-primary"
                    )}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5",
                        selectedTag === tag ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground/60 hover:text-primary"
                      )}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {filteredNotes.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                    <BookOpen className="h-8 w-8 mb-3" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">No entries found</p>
                  </div>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={(e: React.DragEvent) => {
                        e.dataTransfer.setData('application/smartprep-item', JSON.stringify({ type: 'note', id: note.id }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="group"
                    >
                      <motion.div
                        layout
                        variants={fadeUp}
                        onClick={() => { setActiveNoteId(note.id); setIsEditing(false); }}
                        className="p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all border border-border/30 bg-card hover:bg-secondary/40 hover:border-primary/20"
                      >
                        <div className="flex items-start justify-between mb-2">
                        <p className="font-bold text-[13px] text-foreground truncate">{note.title}</p>
                        <button
                          onClick={(e) => handleDelete(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {note.content.replace(/[#*`>_-]/g, '').slice(0, 80)}
                      </p>
                    </motion.div>
                    </div>
                    ))
                )}
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="h-14 px-4 border-b border-border/40 flex items-center justify-between flex-shrink-0 bg-background/50 backdrop-blur-md">
              <button
                onClick={() => setActiveNoteId(null)}
                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Back to Notes</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePin}
                  className={cn(
                    "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    isPinned ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Pin className={cn("h-3 w-3 mr-1.5", isPinned && "fill-current")} />
                  {isPinned ? 'Contextualized' : 'Add to Context'}
                </Button>
                <Button
                  variant={isEditing ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => isEditing ? handleSaveEdit() : startEditingNote(activeNote)}
                  className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-none"
                >
                  {isEditing ? <Check className="h-3 w-3 mr-1.5" /> : <Edit className="h-3 w-3 mr-1.5" />}
                  {isEditing ? 'Sync' : 'Edit'}
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Metadata Tags</label>
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="tag1, tag2..."
                    className="w-full bg-background border border-border/60 rounded-xl p-3 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1 flex flex-col space-y-2 min-h-[300px]">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Content Archive</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full bg-background border border-border/60 rounded-2xl p-5 text-[13px] leading-relaxed outline-none focus:ring-1 focus:ring-primary/20 transition-all resize-none custom-scrollbar font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar bg-background">
                <div className="max-w-prose mx-auto">
                  <h1 className="text-2xl font-bold mb-6 tracking-tight text-foreground">{activeNote.title}</h1>
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotesBoard;

