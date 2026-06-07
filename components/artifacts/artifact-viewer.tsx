'use client';

import React from 'react';
import { 
  SandpackProvider, 
  SandpackLayout, 
  SandpackCodeEditor, 
  SandpackPreview,
  SandpackFileExplorer,
  SandpackConsole
} from "@codesandbox/sandpack-react";
import { useChatStore } from '../../stores/chat-store';
import { Loader2, Maximize2, RotateCcw } from 'lucide-react';

export const ArtifactViewer: React.FC = () => {
  const { activeArtifact } = useChatStore();

  if (!activeArtifact) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4 text-muted-foreground/40">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-border/40 flex items-center justify-center">
          <Maximize2 className="h-6 w-6" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em]">Ready for Artifacts</p>
      </div>
    );
  }

  const { code, language, title } = activeArtifact;

  // Determine Sandpack template based on language
  const template = language === 'tsx' || language === 'jsx' ? 'react-ts' : 'static';
  
  // Prepare files object
  const files = {
    [language === 'tsx' ? '/App.tsx' : language === 'html' ? '/index.html' : '/index.js']: code,
  };

  return (
    <div className="h-full flex flex-col bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/10 flex items-center justify-between flex-shrink-0 bg-secondary/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/60 border border-primary/10">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-foreground uppercase tracking-tight leading-none">{title || 'Preview'}</span>
            <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1 leading-none">{language.toUpperCase()} Artifact</span>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-colors"
          title="Reset Environment"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-0">
        <SandpackProvider
          template={template}
          theme="light"
          files={files}
          options={{
            classes: {
              "sp-wrapper": "h-full border-none",
              "sp-layout": "h-full border-none",
              "sp-stack": "h-full",
            }
          }}
        >
          <SandpackLayout style={{ height: '100%', border: 'none' }}>
            <SandpackCodeEditor 
              style={{ height: '100%' }} 
              showLineNumbers 
              showTabs={false}
              readOnly
            />
            <SandpackPreview 
              style={{ height: '100%' }} 
              showNavigator={false}
              showRefreshButton={false}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};
