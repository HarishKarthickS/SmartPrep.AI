'use client';

import React, { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '../../types/chat';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export const NotesBoard: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  const { showToast } = useToastStore();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');

  const activeNote = notes.find((n) => n.id === activeNoteId);

  // Group tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  const handleCreateNote = () => {
    const id = addNote({
      title: 'New Study Note',
      content: '# New Study Note\n\nStart compiling your reference guides here...',
      tags: ['general'],
    });
    setActiveNoteId(id);
    startEditingNote(notes.find((n) => n.id === id) || {
      id,
      title: 'New Study Note',
      content: '# New Study Note\n\nStart compiling your reference guides here...',
      tags: ['general'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
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

    const tagsArray = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    updateNote(activeNoteId, {
      title: editTitle.trim(),
      content: editContent,
      tags: tagsArray,
    });

    setIsEditing(false);
    showToast('Saved', 'success', 'Study note updated successfully.');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNote(id);
    
    const remaining = notes.filter((n) => n.id !== id);
    if (activeNoteId === id) {
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
      setIsEditing(false);
    }
    showToast('Note Deleted', 'info', 'Note removed from library.');
  };

  const handleExportMarkdown = (n: Note) => {
    const blob = new Blob([n.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${n.title.toLowerCase().replace(/\s+/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported', 'success', 'Successfully compiled note as markdown file.');
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-xs">
      
      {/* Top Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Saved Study Notes</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Organize saved AI outputs and customize study sheets.</p>
        </div>

        <Button
          onClick={handleCreateNote}
          className="h-9 px-3.5 text-xs font-semibold flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Note</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Notes list */}
        <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-border flex flex-col bg-card/25 flex-shrink-0 overflow-hidden select-none">
          
          {/* Notes search */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 bg-card border border-border rounded pl-9 pr-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground transition-all"
              />
            </div>

            {/* Tags scrolling filters */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded text-[10px] cursor-pointer font-bold border transition-all ${
                    !selectedTag
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2.5 py-1 rounded text-[10px] cursor-pointer font-bold border transition-all truncate flex items-center space-x-1 ${
                      selectedTag === tag
                        ? 'bg-primary/10 border-primary/20 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.map((note) => {
              const isActive = activeNoteId === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    setActiveNoteId(note.id);
                    setIsEditing(false);
                  }}
                  className={`p-3 rounded-md cursor-pointer transition-all border flex flex-col justify-between space-y-1.5 ${
                    isActive
                      ? 'bg-secondary text-foreground border-border'
                      : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 pr-4">
                      <FileText className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`} />
                      <p className="font-semibold text-foreground truncate">{note.title}</p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(note.id, e)}
                      className="text-muted-foreground hover:text-destructive p-0.5 rounded opacity-0 group-hover:opacity-100 md:opacity-100 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {note.content.replace(/[#*`>_-]/g, '').slice(0, 80)}
                  </p>

                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="opacity-75">
                      {new Date(note.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    <div className="flex space-x-1">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t} className="bg-muted px-1 py-0.5 rounded font-medium border border-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No study notes found.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Preview & Editing canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {activeNote ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Tool bar header actions */}
              <div className="h-11 border-b border-border bg-card px-5 flex items-center justify-between flex-shrink-0 select-none">
                <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Last edited on {new Date(activeNote.updatedAt).toLocaleString()}</span>
                </div>

                <div className="flex space-x-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportMarkdown(activeNote)}
                    className="h-8.5 text-[11px] font-semibold flex items-center space-x-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export MD</span>
                  </Button>

                  {isEditing ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-8.5 text-[11px] font-semibold flex items-center space-x-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Note</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEditingNote(activeNote)}
                      className="h-8.5 text-[11px] font-semibold flex items-center space-x-1.5 animate-in fade-in"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit Inline</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Editing Form */}
              {isEditing ? (
                <div className="flex-1 p-6 flex flex-col space-y-4 overflow-y-auto select-none">
                  <Input
                    label="Note Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Note Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="e.g. calculus, ap-prep, formula-sheet"
                      className="h-10 bg-card border border-border rounded px-3 text-sm focus:border-primary outline-none text-foreground placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[250px]">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Reference Material (Markdown Supported)
                    </label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full bg-card border border-border rounded p-4 text-sm focus:border-primary outline-none text-foreground resize-none leading-relaxed font-sans"
                    />
                  </div>
                </div>
              ) : (
                /* Rich Markdown rendering */
                <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-slate dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeNote.content}
                  </ReactMarkdown>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
              <FileText className="h-10 w-10 text-muted-foreground/30 mb-3 animate-pulse-slow" />
              <h3 className="text-sm font-semibold text-foreground">Select a Study Note</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1 leading-normal">
                Click a note on the left dashboard to render your study materials, or create a brand new note manually.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default NotesBoard;
