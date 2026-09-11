import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Bus, 
  AlertCircle, 
  CornerDownLeft,
  PhoneCall,
  Navigation
} from 'lucide-react';
import { AIAssistantMessage } from '../../types';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';

interface MargPathAIAssistantProps {
  isOpen?: boolean;
  onClose: () => void;
  activePnr?: string;
  bookingId?: string;
  tripCode?: string;
  busDisplay?: string;
  seatNumber?: string;
  boardingPoint?: string;
  destinationPoint?: string;
  onOpenTracker?: () => void;
}

export const MargPathAIAssistant: React.FC<MargPathAIAssistantProps> = ({
  isOpen = true,
  onClose,
  activePnr,
  bookingId,
  tripCode = 'TRIP-20491',
  busDisplay = 'MP-204',
  seatNumber = 'A12',
  boardingPoint = 'Bhubaneswar Railway Station',
  destinationPoint = 'Puri Bus Stand',
  onOpenTracker
}) => {
  const currentPnr = bookingId || activePnr || 'MP100284';
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Hello! I am **MargPath AI**, your personal journey copilot.\n\nYou are confirmed on **Bus MP-204** (*Bhubaneswar ➔ Puri*). Your bus is currently **4.8 km away** and scheduled to reach **Master Canteen** in **18 minutes**.\n\nHow can I help you right now?`,
      timestamp: 'Just now',
      quickReplies: [
        'Where is my bus?',
        'When will my bus arrive?',
        'How far is my boarding point?',
        'Where is my seat?',
        'What facilities does my bus have?'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    soundEngine.play('CLICK');
    const userMsg: AIAssistantMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await api.askAITripAssistant(text, currentPnr);
      soundEngine.play('SUCCESS');
      const aiMsg: AIAssistantMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: 'Just now',
        quickReplies: response.suggestions,
        contextTelemetry: response.contextTelemetry
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      soundEngine.play('ERROR');
      const errorMsg: AIAssistantMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `I apologize, but I encountered a momentary connection issue. You can still view live telemetry directly in the **Private Live Bus Tracker**.`,
        timestamp: 'Just now',
        quickReplies: ['Where is my bus?', 'How far is my boarding point?']
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl h-[90vh] max-h-[700px] flex flex-col overflow-hidden shadow-2xl text-slate-100 relative">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">MargPath AI Copilot</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold border border-cyan-500/30">
                  LIVE GPT-4o
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Fleet-Leakage Isolation • Booking {activePnr}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Context Telemetry Ribbon */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300 overflow-x-auto gap-4 shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-400">Assigned Bus:</span>
            <span className="font-mono font-black text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">MP-204</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>ETA: <strong className="text-white font-bold">18 min</strong> (4.8 km away)</span>
          </div>
          {onOpenTracker && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTracker();
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1 border border-cyan-500/30 transition shrink-0 cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              <span>Open Live Map</span>
            </button>
          )}
        </div>

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map(msg => {
            const isAi = msg.sender === 'assistant';
            return (
              <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'}`}>
                <div className="flex items-end gap-2 max-w-[88%]">
                  {isAi && (
                    <div className="w-7 h-7 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                      isAi
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 shadow-md rounded-bl-xs'
                        : 'bg-[#D84E55] text-white font-medium shadow-md shadow-red-500/20 rounded-br-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* Quick Reply Chips */}
                {isAi && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 ml-9 max-w-[90%]">
                    {msg.quickReplies.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(chip)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-cyan-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownLeft className="w-3 h-3 text-cyan-400" />
                        <span>{chip}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic ml-9">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>MargPath AI is checking live GPS corridor telemetry...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask MargPath AI anything about your bus, seat, or route..."
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
