'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2, Database, Info, Cpu, Sparkles, Brain, Globe, Shield, Image, Mic, Video, File, Type } from 'lucide-react';
import { OpenRouterModel } from '../../types/models';
import { fetchModels } from '../../lib/openrouter/client';
import { cn } from '../../lib/utils/cn';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelect: (modelId: string) => void;
  apiKey?: string;
  maxHeight?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelect,
  apiKey,
  maxHeight = '300px'
}) => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFreeOnly, setIsFreeOnly] = useState(true);

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true);
      try {
        const data = await fetchModels(apiKey);
        setModels(data);
      } catch (e) {
        console.error('Failed to load models:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadModels();
  }, [apiKey]);

  const filteredModels = useMemo(() => {
    let result = [...models];

    if (isFreeOnly) {
      result = result.filter(m => 
        m.id.toLowerCase().includes(':free') || 
        (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.id.toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q)
      );
    }

    // Sort by context length (desc) - Largest to Smallest
    return result.sort((a, b) => (b.contextLength || 0) - (a.contextLength || 0)).slice(0, 100);
  }, [models, search, isFreeOnly]);

  const getModelIcon = (id: string) => {
    if (id.includes('gpt')) return <Cpu className="h-4 w-4 text-sky-500" />;
    if (id.includes('claude')) return <Brain className="h-4 w-4 text-indigo-500" />;
    if (id.includes('gemini')) return <Sparkles className="h-4 w-4 text-primary" />;
    if (id.includes('llama')) return <Shield className="h-4 w-4 text-emerald-500" />;
    return <Globe className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="label-shelf">OpenRouter models</h4>
          <button 
            onClick={() => setIsFreeOnly(!isFreeOnly)}
            className="flex items-center space-x-2 group cursor-pointer"
          >
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-widest transition-colors",
              isFreeOnly ? "text-primary" : "text-muted-foreground/40"
            )}>Free Only</span>
            <div className={cn(
              "w-8 h-4 rounded-full relative transition-colors duration-300",
              isFreeOnly ? "bg-primary/20" : "bg-secondary"
            )}>
              <motion.div 
                animate={{ x: isFreeOnly ? 16 : 2 }}
                className={cn(
                  "absolute top-1 w-2.5 h-2.5 rounded-full transition-colors",
                  isFreeOnly ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            </div>
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={isFreeOnly ? "Search free models..." : "Search all models..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-3 text-[13px] outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-medium text-foreground"
          />
        </div>
      </div>

      <div 
        className="overflow-y-auto custom-scrollbar space-y-2 pr-1"
        style={{ maxHeight }}
      >
        {isLoading && models.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-3 opacity-40">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Discovering Models...</span>
          </div>
        ) : (
          filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={cn(
                "w-full p-4 text-left border transition-all duration-300 flex flex-col space-y-2 group",
                selectedModelId === model.id 
                  ? "bg-secondary/60 border-primary/30" 
                  : "border-border/40 bg-card hover:bg-secondary/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-background border border-border/60 flex items-center justify-center flex-shrink-0 transition-transform">
                    {getModelIcon(model.id)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[13px] text-foreground truncate">{model.name}</p>
                    <p className="text-[9px] text-muted-foreground/50 truncate font-mono font-bold tracking-tight uppercase">{model.id}</p>
                  </div>
                </div>
                {selectedModelId === model.id && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </motion.div>
                )}
              </div>

              {model.description && (
                <p className="text-[11px] text-muted-foreground/70 leading-relaxed line-clamp-2 px-0.5 font-medium">
                  {model.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 px-0.5 pt-1">
                <div className="flex items-center space-x-1.5 label-shelf bg-secondary/80 px-2 py-0.5 border border-border">
                  <Database className="h-2.5 w-2.5" />
                  <span>{Math.round((model.contextLength || 0) / 1000)}k Context</span>
                </div>

                {model.pricing && (
                  <div className="flex items-center space-x-1.5 label-shelf px-2 py-0.5 border border-primary/20">
                    <Info className="h-2.5 w-2.5" />
                    <span>${(Number(model.pricing.prompt) * 1000000).toFixed(2)} / 1M</span>
                  </div>
                )}
              </div>
            </button>
          ))
        )}

        {!isLoading && filteredModels.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
};
