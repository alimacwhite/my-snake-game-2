import React, { useEffect, useRef } from 'react';
import { CommentaryMessage } from '../types';
import { Bot, Sparkles } from 'lucide-react';

interface CommentaryPanelProps {
  messages: CommentaryMessage[];
}

const CommentaryPanel: React.FC<CommentaryPanelProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full max-w-md md:w-80 h-48 md:h-[500px] bg-black/60 border border-gray-700 rounded-xl flex flex-col overflow-hidden shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="p-3 bg-gray-900/80 border-b border-gray-700 flex items-center gap-2">
        <Bot className="text-neon-pink" size={20} />
        <span className="font-mono text-neon-pink font-bold text-sm">NEON_BIT_AI</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs text-gray-400">ONLINE</span>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm mt-10 italic">
            Waiting for game start...
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-center text-center opacity-50'}`}
          >
            {msg.sender === 'ai' ? (
              <div className="bg-gray-800/80 border border-gray-600 rounded-lg rounded-tl-none p-3 text-sm shadow-sm relative">
                <Sparkles size={12} className="absolute -top-2 -left-2 text-yellow-400" />
                <p className="text-gray-100 leading-relaxed">{msg.text}</p>
                <span className="text-[10px] text-gray-500 mt-1 block text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-400 font-mono py-1 border-b border-gray-800 w-full">
                {msg.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentaryPanel;