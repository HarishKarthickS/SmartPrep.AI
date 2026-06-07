'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  HelpCircle,
  Layers,
  BrainCircuit,
  Calendar,
  Sparkles,
  Search,
  BookOpen,
  Wrench,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { defaultTools } from '../../data/default-tools';
import { AITool } from '../../types/tools';
import { ToolRunner } from './tool-runner';
import { cn } from '../../lib/utils/cn';
import { fadeUp, staggerContainer, hoverScale, springTransition } from '../../lib/utils/animations';

export const ToolsHub: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const iconMap: Record<string, React.ReactNode> = {
    FileText: <FileText className="h-5 w-5 text-indigo-500" />,
    HelpCircle: <HelpCircle className="h-5 w-5 text-amber-500" />,
    Layers: <Layers className="h-5 w-5 text-emerald-500" />,
    BrainCircuit: <BrainCircuit className="h-5 w-5 text-sky-500" />,
    Calendar: <Calendar className="h-5 w-5 text-rose-500" />,
  };

  const filteredTools = defaultTools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedTool) {
    return <ToolRunner tool={selectedTool} onBack={() => setSelectedTool(null)} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      
      {/* Header */}
      <div className="h-16 px-8 flex items-center justify-between flex-shrink-0 bg-background/80 backdrop-blur-sm border-b border-border/40 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-primary">
            <Wrench className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-foreground">Intelligence Hub</h2>
            <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest mt-0.5">Accelerate your workflow</p>
          </div>
        </div>

        <div className="relative group w-72">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search intelligence masks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 bg-secondary border border-border/40 rounded-xl pl-10 pr-4 text-[11px] font-medium outline-none focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <motion.div 
            variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filteredTools.map((tool) => (
              <motion.div
                layout
                variants={fadeUp}
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className="group p-7 bg-card border border-border/60 rounded-[24px] cursor-pointer flex flex-col justify-between min-h-[200px] relative overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border/40 group-hover:border-primary/20 transition-all shadow-none">
                    {iconMap[tool.icon]}
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-[14px] font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-[12px] text-muted-foreground/70 leading-relaxed font-medium">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 relative z-10">
                  <div className="flex items-center space-x-2 text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
                    <span>Activate Mask</span>
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence>
            {filteredTools.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-32 space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground/20">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  No masks found matching "{searchQuery}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
};

export default ToolsHub;

