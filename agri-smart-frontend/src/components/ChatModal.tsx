import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  message_id: string;
  sender_id: string;
  sender_role: string;
  text: string;
  created_at: string;
}

interface ChatModalProps {
  orderId: string;
  onClose: () => void;
}

export default function ChatModal({ orderId, onClose }: ChatModalProps) {
  const { session, user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const fetchMessages = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/chat/${orderId}/messages`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [orderId, session?.access_token]);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session?.access_token) return;
    
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/chat/${orderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text: inputText }),
      });
      if (res.ok) {
        setInputText('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-md flex flex-col animate-slide-down"
        style={{
          height: 'min(82vh, 600px)',
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(22,163,74,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm tracking-tight">Order Chat</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <p className="text-[11px] text-green-100 font-medium">Live · auto-refreshes</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/15 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ background: 'linear-gradient(180deg, #f8fffe 0%, #f0fdf4 100%)' }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-green-500" />
                <p className="text-xs text-gray-400 font-medium">Loading messages…</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #d1fae5)' }}
              >
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Say hello to start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={msg.message_id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 max-w-[82%] text-sm leading-relaxed ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] px-1 font-medium" style={{ color: '#94a3b8' }}>
                    {msg.sender_role} · {time}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="flex-shrink-0 p-4"
          style={{
            background: '#fff',
            borderTop: '1px solid rgba(22,163,74,0.08)',
          }}
        >
          <form onSubmit={handleSend} className="flex items-center gap-2.5">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 text-sm px-4 py-3 rounded-2xl transition-all"
              style={{
                background: '#f0fdf4',
                border: '1.5px solid rgba(22,163,74,0.14)',
                color: '#0f172a',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#22c55e';
                e.target.style.background = '#fff';
                e.target.style.boxShadow = '0 0 0 4px rgba(22,163,74,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(22,163,74,0.14)';
                e.target.style.background = '#f0fdf4';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="p-3 rounded-2xl text-white transition-all flex-shrink-0 disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
                boxShadow: '0 4px 12px rgba(22,163,74,0.28)',
              }}
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
