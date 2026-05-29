'use client';

import React, { useState } from 'react';
import {
  FileText,
  HelpCircle,
  Layers,
  BrainCircuit,
  Calendar,
  Sparkles,
  Search,
  BookOpen
} from 'lucide-react';
import { defaultTools } from '../../data/default-tools';
import { AITool } from '../../types/tools';
import { ToolRunner } from './tool-runner';

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
    return (
      <ToolRunner tool={selectedTool} onBack={() => setSelectedTool(null)} />
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden text-xs">
      
      {/* Top Header */}
      <div className="h-14 border-b border-border px-6 flex items-center justify-between flex-shrink-0 bg-card select-none">
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Tools Hub</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Accelerate your study workflow with pre-configured task formulas.</p>
        </div>

        {/* Local Search bar */}
        <div className="relative flex items-center w-64">
          <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8.5 bg-muted/40 border border-border rounded-md pl-9 pr-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className="group p-5 bg-card border border-border rounded-lg shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-primary/[0.01] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[150px] relative overflow-hidden active:scale-[0.99] select-none"
              >
                {/* Background decorative corner detail */}
                <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-200 pointer-events-none">
                  {iconMap[tool.icon]}
                </div>

                <div className="space-y-2.5">
                  <div className="bg-muted p-2.5 rounded-md w-fit flex items-center justify-center group-hover:bg-primary/10 transition-colors border border-border group-hover:border-primary/20">
                    {iconMap[tool.icon]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                  <span>Launch Tool</span>
                  <Sparkles className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              No matching AI tools found. Try searching another term.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
export default ToolsHub;
