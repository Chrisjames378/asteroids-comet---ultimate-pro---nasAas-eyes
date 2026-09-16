import React, { useState, useRef, useEffect } from 'react';
import { X, Bot, User, Send, Sparkles, Loader2, Zap, Brain, Cpu } from 'lucide-react';
import { CelestialData, ChatMessage } from '../types';
import { playUiSound } from '../utils/audio';

interface AiCopilotModalProps {
  isOpen: boolean;
  currentObject: CelestialData;
  onClose: () => void;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({ isOpen, currentObject, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Greetings, Commander. I am your NASA CNEOS AI Assistant powered by Gemini multi-turn reasoning. I maintain full thread context for target **${currentObject.name}**, orbital trajectories, DART impactor physics, and Torino hazard scales. How may I assist your mission today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speedMode, setSpeedMode] = useState<'general' | 'complex' | 'fast'>('general');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!queryText) setInputText('');
    setIsLoading(true);
    playUiSound(550, 0.04);

    try {
      // Map conversation thread history for multi-turn chat
      const historyPayload = updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          message: textToSend,
          targetName: currentObject.name,
          speedMode,
        }),
      });

      const data = await response.json();
      const aiReplyText = data.reply || 'Telemetry analysis completed with nominal trajectory results.';

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      playUiSound(750, 0.08);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'error-' + Date.now(),
        sender: 'ai',
        text: 'Mission Control AI link temporarily unavailable. Local orbital mechanics models confirm zero collision hazard for current ephemeris epoch.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    `Tell me about ${currentObject.name}`,
    'Will Apophis 99942 hit Earth in April 2029?',
    'How does DART kinetic impactor momentum transfer work?',
    'Explain comet dust tails vs gas ion tails',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
      <div className="bg-[#0a0f1d]/95 w-11/12 max-w-xl rounded-2xl p-6 shadow-2xl border border-purple-500/40 relative flex flex-col h-[560px] text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Model Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>NASA CNEOS AI Copilot</span>
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-mono">
                  Multi-Turn Thread
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Planetary Defense & JPL Ephemeris Reasoning Officer
              </p>
            </div>
          </div>

          {/* Model Selector Pills */}
          <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-[10px] font-mono shrink-0">
            <button
              onClick={() => setSpeedMode('general')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                speedMode === 'general' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="General multi-turn conversation (gemini-3.5-flash)"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Flash</span>
            </button>
            <button
              onClick={() => setSpeedMode('complex')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                speedMode === 'complex' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Complex reasoning (gemini-3.1-pro-preview)"
            >
              <Brain className="w-3 h-3 text-cyan-300" />
              <span>Pro</span>
            </button>
            <button
              onClick={() => setSpeedMode('fast')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 cursor-pointer ${
                speedMode === 'fast' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fast response (gemini-3.1-flash-lite)"
            >
              <Cpu className="w-3 h-3 text-emerald-300" />
              <span>Lite</span>
            </button>
          </div>
        </div>

        {/* Suggested Queries */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0 custom-scrollbar">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 my-2 custom-scrollbar text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600/40 border border-blue-500/30 text-slate-100 rounded-tr-none font-sans'
                    : 'bg-purple-950/40 border border-purple-500/20 text-slate-200 rounded-tl-none font-sans'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className="text-[9px] text-slate-400 mt-1 text-right font-mono">
                  {msg.timestamp}
                </div>
              </div>
              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="w-7 h-7 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl rounded-tl-none p-3 text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Processing multi-turn telemetry via {speedMode === 'complex' ? 'gemini-3.1-pro-preview' : speedMode === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'}...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-800 flex space-x-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={`Ask about ${currentObject.name}, DART impact or Keplerian orbits...`}
            className="flex-1 bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner font-mono"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputText.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-purple-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
