'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Search,
  ChevronLeft,
  Pin,
  Upload,
  Loader2
} from 'lucide-react';
import { LibraryItem } from '../../types/chat';
import { useNotesStore } from '../../stores/notes-store';
import { useChatStore } from '../../stores/chat-store';
import { useToastStore } from '../../stores/toast-store';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../../lib/utils/cn';
import { fadeUp, staggerContainer, springTransition } from '../../lib/utils/animations';
import { parseFile } from '../../lib/utils/file-parser';
import { chunkText, generateEmbedding } from '../../lib/utils/embeddings';
import { db } from '../../lib/db/dexie';

export const LibraryBoard: React.FC = () => {
  const { library, addLibraryItem, deleteLibraryItem } = useNotesStore();
  const { activeSessionId, attachContext, detachContext, sessions } = useChatStore();
  const { showToast } = useToastStore();

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'document' | 'source' | 'flashcards' | 'quiz'>('all');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'document' | 'source' | 'flashcards' | 'quiz'>('document');
  const [tagsInput, setTagsInput] = useState('');

  const activeItem = library.find((item) => item.id === activeItemId);
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const isPinned = activeItemId ? activeSession?.attachedContexts?.some(c => c.type === 'library' && c.id === activeItemId) : false;

  const togglePin = () => {
    if (!activeSessionId || !activeItemId) return;
    if (isPinned) {
      detachContext(activeSessionId, 'library', activeItemId);
      showToast('Detached', 'info', 'Source removed from chat context.');
    } else {
      attachContext(activeSessionId, 'library', activeItemId);
      showToast('Attached', 'success', 'Source pinned to chat context.');
    }
  };

  const processAndAddItem = async (itemTitle: string, itemContent: string, itemType: typeof type, tags: string[]) => {
    const id = addLibraryItem({ 
      title: itemTitle, 
      content: itemContent, 
      type: itemType, 
      tags: tags.length > 0 ? tags : ['library'] 
    });

    // Chunk and embed for RAG
    const chunks = chunkText(itemContent);
    const chunkPromises = chunks.map(async (chunk) => {
      const embedding = await generateEmbedding(chunk);
      return db.documentChunks.add({
        libraryItemId: id,
        content: chunk,
        embedding
      });
    });

    await Promise.all(chunkPromises);
    return id;
  };

  const handleAddItem = async () => {
    if (!title.trim() || !content.trim()) {
      showToast('Error', 'error', 'Title and content are required.');
      return;
    }
    setIsProcessing(true);
    try {
      const tagsArray = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
      const id = await processAndAddItem(title.trim(), content.trim(), type, tagsArray);
      setActiveItemId(id);
      setShowAddModal(false);
      setTitle(''); setContent(''); setType('document'); setTagsInput('');
      showToast('Success', 'success', 'Material added to library.');
    } catch (error) {
      console.error('Error adding item:', error);
      showToast('Error', 'error', 'Failed to process material.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    showToast('Processing', 'info', `Parsing and indexing ${file.name}...`);

    try {
      const parsedContent = await parseFile(file);
      const id = await processAndAddItem(
        file.name.replace(/\.[^/.]+$/, ""), 
        parsedContent, 
        'document', 
        ['upload', file.type.split('/')[1]]
      );
      setActiveItemId(id);
      showToast('Success', 'success', `${file.name} uploaded and indexed.`);
    } catch (error: any) {
      console.error('File upload error:', error);
      showToast('Error', 'error', error.message || 'Failed to process file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLibraryItem(id);
    
    // Also delete chunks from Dexie
    await db.documentChunks.where('libraryItemId').equals(id).delete();

    const remaining = library.filter((item) => item.id !== id);
    if (activeItemId === id) setActiveItemId(remaining.length > 0 ? remaining[0].id : null);
    showToast('Deleted', 'info', 'Source removed.');
  };

  const getIcon = (itemType: string, active: boolean) => {
    const iconClass = cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground/60");
    switch (itemType) {
      case 'document': return <FileText className={iconClass} />;
      case 'source': return <Link2 className={iconClass} />;
      case 'flashcards': return <Layers className={iconClass} />;
      case 'quiz': return <HelpCircle className={iconClass} />;
      default: return <BookOpen className={iconClass} />;
    }
  };

  const filteredLibrary = library.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeItem ? (
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
                  <Library className="h-5 w-5" />
                </div>
                <h2 className="text-[14px] font-bold text-foreground tracking-tight truncate">Resources</h2>
              </div>

              <div className="flex items-center space-x-2">
                <label className={cn(
                  "h-9 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center cursor-pointer transition-all",
                  isProcessing ? "bg-secondary text-muted-foreground cursor-not-allowed" : "bg-secondary text-foreground hover:bg-secondary/80"
                )}>
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-2" />}
                  <span>{isProcessing ? 'Processing' : 'Upload'}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.md"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </label>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="h-9 px-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-none flex items-center justify-center"
                  disabled={isProcessing}
                >
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  <span>Add Material</span>
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4 border-b border-border/20">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-secondary border border-border/40 rounded-xl pl-10 pr-3 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['all', 'document', 'source', 'flashcards', 'quiz'].map((fType) => (
                  <button
                    key={fType}
                    onClick={() => setSelectedTypeFilter(fType as any)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      selectedTypeFilter === fType ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground/60 hover:text-primary"
                    )}
                  >
                    {fType}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                {filteredLibrary.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                    <BookOpen className="h-8 w-8 mb-3" />
                    <p className="text-[11px] font-bold uppercase tracking-widest">Library is empty</p>
                  </div>
                ) : (
                  filteredLibrary.map((item) => (
                    <motion.div
                      layout
                      variants={fadeUp}
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/smartprep-item', JSON.stringify({ type: 'library', id: item.id }));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={() => setActiveItemId(item.id)}
                      className="group p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all border border-border/30 bg-card hover:bg-secondary/40 hover:border-primary/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 min-w-0">
                          {getIcon(item.type, false)}
                          <p className="font-bold text-[13px] text-foreground truncate">{item.title}</p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                        {item.content.replace(/[#*`>_-]/g, '').slice(0, 80)}
                      </p>
                    </motion.div>
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
                onClick={() => setActiveItemId(null)}
                className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-foreground transition-all flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Back to Resources</span>
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
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
              <div className="max-w-prose mx-auto px-8 py-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                    {getIcon(activeItem.type, true)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {activeItem.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-secondary text-[9px] font-black text-muted-foreground uppercase tracking-wider">#{tag}</span>
                    ))}
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-6 tracking-tight text-foreground">{activeItem.title}</h1>
                <div className="prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeItem.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm" 
              onClick={() => setShowAddModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-card border border-border rounded-[32px] shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <h3 className="text-base font-bold text-foreground tracking-tight">Archive Material</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full text-muted-foreground transition-all">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-8 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. History Summary" className="w-full bg-background border border-border/60 rounded-xl p-3 text-sm font-bold outline-none focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Category</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-background border border-border/60 rounded-xl p-3 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-primary/20 appearance-none transition-all text-foreground">
                    <option value="document">Document</option>
                    <option value="source">Reference</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="quiz">Question Bank</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Tags</label>
                  <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="science, final-exam..." className="w-full bg-background border border-border/60 rounded-xl p-3 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all" />
                </div>

                <div className="space-y-2 flex-1 min-h-[200px] flex flex-col">
                  <label className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-1">Content Archive</label>
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 w-full bg-background border border-border/60 rounded-2xl p-5 text-[13px] leading-relaxed outline-none focus:ring-1 focus:ring-primary/20 transition-all resize-none font-medium" />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 p-6 border-t border-border/50 bg-secondary/20">
                <Button variant="ghost" onClick={() => setShowAddModal(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                <Button onClick={handleAddItem} className="rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-none">Sync Material</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LibraryBoard;

