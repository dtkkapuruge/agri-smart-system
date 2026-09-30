import React, { useEffect, useState, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-black border border-white/10 w-full max-w-md h-[80vh] rounded-2xl shadow-xl flex flex-col" style={{ background: 'var(--background)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10" style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold">Order Chat</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400 mt-4">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-800 text-white rounded-bl-none'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">
                    {msg.sender_role} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10" style={{ borderColor: 'var(--border)' }}>
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input-field !rounded-full px-4 py-2"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="bg-green-600 p-2.5 rounded-full text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
