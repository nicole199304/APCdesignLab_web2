import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { ChatMessage } from '../types';
import { generateChatResponse } from '../services/geminiService';

interface SidebarProps {
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ chatHistory, setChatHistory }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const responseText = await generateChatResponse(userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-[300px] bg-[#131313] border-r border-[#222] flex flex-col h-full z-20 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-[#222]">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
            R
          </div>
          <span className="font-semibold text-lg tracking-tight">RoboNeo</span>
        </div>

        <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-xs py-2 rounded-md transition-colors border border-white/5">
                <Icons.Plus size={14} /> New Chat
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-xs py-2 rounded-md transition-colors border border-white/5">
                <Icons.History size={14} /> History
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {chatHistory.length === 0 && (
            <div className="text-center mt-20 opacity-40">
                <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Wand size={24} />
                </div>
                <p className="text-sm">How can I help you edit today?</p>
            </div>
        )}
        
        {chatHistory.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-sm' 
                  : 'bg-[#222] text-gray-200 rounded-bl-sm border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-[#222] rounded-2xl rounded-bl-sm px-4 py-3 border border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-[#222]">
        <div className="relative bg-[#0a0a0a] rounded-xl border border-[#333] focus-within:border-purple-500/50 transition-colors">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe edits or ask questions..."
            className="w-full bg-transparent text-sm p-3 pr-10 min-h-[50px] max-h-[120px] resize-none focus:outline-none scrollbar-hide text-gray-300 placeholder-gray-600"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Icons.Send size={14} />
          </button>
        </div>
        <div className="flex justify-between mt-3 text-[10px] text-gray-600 px-1">
             <div className="flex gap-3">
                <button className="hover:text-gray-400 flex items-center gap-1"><Icons.Image size={12}/> Ref Image</button>
                <button className="hover:text-gray-400 flex items-center gap-1"><Icons.Layers size={12}/> Selection</button>
             </div>
        </div>
      </div>
    </div>
  );
};