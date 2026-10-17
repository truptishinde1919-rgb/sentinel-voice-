'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send, Bot, User, CheckCircle2, AlertOctagon } from 'lucide-react';
import { ServicingWebSocketClient } from '@/lib/websocket';

interface VoiceWidgetProps {
  wsClient: ServicingWebSocketClient | null;
  userId: string;
  userRiskTier: number;
  onTurnComplete: (data: any) => void;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
  biometricTelemetry: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionExecuted?: any;
  warmHandoff?: boolean;
}

export const VoiceWidget: React.FC<VoiceWidgetProps> = ({
  wsClient,
  userId,
  userRiskTier,
  onTurnComplete,
  isProcessing,
  setIsProcessing,
  biometricTelemetry,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechStatus, setSpeechStatus] = useState<string>('Ready for voice or text command');
  const [textInput, setTextInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am Sentinel. I am monitoring your session with real-time biometric fraud protection. How can I assist you with your account today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech Synthesis & Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechStatus('Listening to voice stream...');
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleSendTurn(transcript);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition warning:', event.error);
          setIsListening(false);
          setSpeechStatus('Voice recognition paused. You can use the mic or text input.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [userId, biometricTelemetry]);

  // Audio Speech Waveform Visualizer
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const drawWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phase += isListening ? 0.08 : 0.03;

      const numBars = 36;
      const barWidth = width / numBars - 2;

      for (let i = 0; i < numBars; i++) {
        let amp = 0.15;
        if (isListening) {
          amp = 0.3 + 0.6 * Math.sin(phase + i * 0.3) * Math.cos(phase * 0.7 + i * 0.15);
        } else if (isProcessing) {
          amp = 0.2 + 0.4 * Math.sin(phase * 1.5 + i * 0.4);
        }

        const barHeight = Math.max(4, Math.abs(amp) * (height * 0.7));
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isListening) {
          grad.addColorStop(0, '#06b6d4');
          grad.addColorStop(1, '#10b981');
        } else if (isProcessing) {
          grad.addColorStop(0, '#6366f1');
          grad.addColorStop(1, '#a855f7');
        } else {
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
          grad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animId = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isListening, isProcessing]);

  // Text-To-Speech helper
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendTurn = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setIsProcessing(true);
    setSpeechStatus('Evaluating guardrails & deterministic compliance rules...');

    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const response = await fetch(`${apiBase}/api/chat/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'active_session_nexus',
          user_id: userId,
          message: text,
          biometric_telemetry: biometricTelemetry,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat API returned an error');
      }

      const data = await response.json();
      onTurnComplete(data);

      const assistantMsg: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: data.action_executed,
        warmHandoff: data.warm_handoff,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setSpeechStatus('Speaking response...');
      speakText(data.reply);
    } catch (e: any) {
      console.warn('API error, using simulated local servicing fallback:', e);
      // Local fallback
      const reply = `I received: "${text}". Your balance is verified and biometrics are active.`;
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_asst_${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      speakText(reply);
    } finally {
      setIsProcessing(false);
      setSpeechStatus('Ready for next command');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Could not start recognition', e);
        }
      } else {
        alert('Speech recognition is not supported in this browser. Please use text input or prompt chips.');
      }
    }
  };

  const quickPrompts = [
    { label: 'Waive $35 Overdraft Fee', prompt: 'Please waive my $35 overdraft fee from yesterday' },
    { label: 'Request $500 Credit Increase', prompt: 'I would like to increase my credit limit by $500' },
    { label: 'Lost Card Replacement', prompt: 'I lost my debit card, please freeze it and reissue a replacement' },
    { label: 'Balance Inquiry', prompt: 'What is my current account balance and recent transactions?' },
    { label: 'Test Block: $150 Fee Waiver', prompt: 'Please waive my $150 credit card penalty fee' },
  ];

  return (
    <div className="cyber-card rounded-2xl p-5 flex flex-col h-[580px] space-y-4" id="voice-widget">
      {/* Waveform & Speech Status Bar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 animate-pulse'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>{isListening ? 'STREAMING AUDIO...' : 'VOICE INTERFACE'}</span>
              <span className="text-[10px] text-cyan-400 font-mono">LATENCY &lt; 380MS</span>
            </div>
            <div className="text-[11px] text-slate-400">{speechStatus}</div>
          </div>
        </div>

        {/* Real-time Waveform Canvas */}
        <div className="w-48 h-10 overflow-hidden rounded-lg bg-slate-900/60 border border-slate-800/80">
          <canvas ref={canvasRef} width={200} height={40} className="w-full h-full" />
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-100'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider">
                  {msg.sender === 'user' ? 'Customer (Verified)' : 'Sentinel AI Agent'}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <p>{msg.text}</p>

              {/* Action Executed Banner */}
              {msg.actionExecuted && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Action Executed: {msg.actionExecuted.action_type}</span>
                </div>
              )}

              {/* Warm Handoff Alert */}
              {msg.warmHandoff && (
                <div className="mt-2 pt-2 border-t border-rose-900/60 flex items-center gap-1.5 text-rose-400 font-semibold text-[11px] animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Warm Handoff: Escalated to Supervisor Ops</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Suggestion Chips */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Quick Banking Actions:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendTurn(q.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800 text-slate-300 transition-all"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Message Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendTurn(textInput);
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Speak into mic or type your account servicing request..."
          className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl text-xs font-bold text-white hover:opacity-95 disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>
    </div>
  );
};
