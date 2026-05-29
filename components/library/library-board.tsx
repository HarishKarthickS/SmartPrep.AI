'use client';

import React, { useState } from 'react';
import {
  Library,
  Plus,
  Trash2,
  BookOpen,
  FileText,
  HelpCircle,
  Layers,
  Link2,
  Calendar,
  X,
  Search
} from 'lucide-react';
import { LibraryItem } from '../../types/chat';
import { useNotesStore } from '../../stores/notes-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const LibraryBoard: React.FC = () => {
  const { library, addLibraryItem, deleteLibraryItem } = useNotesStore();
  const { showToast } = useToastStore();

  const [activeItemId, setActiveItemId] = useState<string | null>(library[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'document' | 'source' | 'flashcards' | 'quiz'>('all');

  // Add Item States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'document' | 'source' | 'flashcards' | 'quiz'>('document');
  const [tagsInput, setTagsInput] = useState('');

  const activeItem = library.find((item) => item.id === activeItemId);

  const handleAddItem = () => {
    if (!title.trim() || !content.trim()) {
      showToast('Validation Error', 'error', 'Title and reference content are required.');
      return;
    }

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const id = addLibraryItem({
      title: title.trim(),
      content: content.trim(),
      type,
      tags: tagsArray.length > 0 ? tagsArray : ['library'],
    });

    setActiveItemId(id);
    setShowAddModal(false);

    // Reset Form
    setTitle('');
    setContent('');
    setType('document');
    setTagsInput('');

    showToast('Source Added', 'success', 'Material successfully added to your Study Library.');
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLibraryItem(id);
    const remaining = library.filter((item) => item.id !== id);
    if (activeItemId === id) {
      setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
    }
    showToast('Deleted', 'info', 'Source removed from library.');
  };

  const getIcon = (itemType: string) => {
    switch (itemType) {
      case 'document':
        return <FileText className="h-4 w-4 text-indigo-500" />;
      case 'source':
        return <Link2 className="h-4 w-4 text-sky-500" />;
      case 'flashcards':
        return <Layers className="h-4 w-4 text-emerald-500" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-primary" />;
    }
  };

  // Filter materials
  const filteredLibrary = library.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-xs">
      
      {/* Top Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Study Library</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Your catalog of uploaded resources, textbooks, and flashcards.</p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="h-9 px-3.5 text-xs font-semibold flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Resource</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Resources list */}
        <div className="w-full md:w-[320px] border-b md:border-b-0 md:border-r border-border flex flex-col bg-card/25 flex-shrink-0 overflow-hidden select-none">
          
          {/* Library Search & Filter */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 bg-card border border-border rounded pl-9 pr-3 text-xs outline-none focus:border-primary placeholder:text-muted-foreground transition-all"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex flex-wrap gap-1">
              {['all', 'document', 'source', 'flashcards', 'quiz'].map((fType) => (
                <button
                  key={fType}
                  onClick={() => setSelectedTypeFilter(fType as any)}
                  className={`px-2 py-1 rounded text-[9px] cursor-pointer font-bold border transition-all ${
                    selectedTypeFilter === fType
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fType.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredLibrary.map((item) => {
              const isActive = activeItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItemId(item.id)}
                  className={`p-3 rounded-md cursor-pointer transition-all border flex flex-col justify-between space-y-1.5 ${
                    isActive
                      ? 'bg-secondary text-foreground border-border'
                      : 'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 pr-4">
                      {getIcon(item.type)}
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="text-muted-foreground hover:text-destructive p-0.5 rounded opacity-0 group-hover:opacity-100 md:opacity-100 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.content.replace(/[#*`>_-]/g, '').slice(0, 85)}
                  </p>

                  <div className="flex items-center justify-between text-[9px] pt-1">
                    <span className="opacity-75">
                      {new Date(item.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>

                    <span className="bg-muted px-1.5 py-0.5 rounded font-bold border border-border uppercase text-[8px] text-primary/80">
                      {item.type}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredLibrary.length === 0 && (
              <div className="text-center py-10 text-muted-foreground select-none">
                Your Library is empty.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Render Material contents */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {activeItem ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Material metadata tag bar */}
              <div className="h-11 border-b border-border bg-card px-5 flex items-center justify-between flex-shrink-0 select-none">
                <div className="flex items-center space-x-2 text-[10px] text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Added {new Date(activeItem.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex space-x-1">
                  {activeItem.tags.map((tag) => (
                    <span key={tag} className="bg-muted text-[9px] px-2 py-0.5 rounded border border-border text-muted-foreground font-semibold">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rendering canvas */}
              <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-slate dark:prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                <h1 className="text-xl font-bold mb-4">{activeItem.title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeItem.content}
                </ReactMarkdown>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
              <Library className="h-10 w-10 text-muted-foreground/30 mb-3 animate-pulse-slow" />
              <h3 className="text-sm font-semibold text-foreground">Select a Source Material</h3>
              <p className="text-[11px] text-muted-foreground max-w-xs mt-1 leading-normal">
                Click a textbook chapter or pasted file in your sidebar catalog, or upload a new research text source directly.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative w-full max-w-lg bg-card border border-border rounded-lg shadow-xl z-10 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Add Resource to Library</h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col space-y-4 overflow-y-auto">
              <Input
                label="Resource Name / Title"
                placeholder="e.g. Chapter 4: Photosynthesis Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Select
                label="Resource Type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                options={[
                  { label: 'Pasted Document', value: 'document' },
                  { label: 'Article / URL Reference Source', value: 'source' },
                  { label: 'Active Recall Flashcards Set', value: 'flashcards' },
                  { label: 'Quiz Questions Bank', value: 'quiz' },
                ]}
              />

              <Input
                label="Tags (Comma Separated)"
                placeholder="e.g. biology, science, midterm-exam"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Resource Text Content
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste reference text, transcripts, article paragraphs, or outlines here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-card border border-border rounded p-3 text-xs outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 resize-none font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-4 border-t border-border bg-muted/40">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>
                Save Resource
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LibraryBoard;
