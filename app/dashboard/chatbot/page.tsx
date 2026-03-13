'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

export default function ChatbotPage() {
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: 'Halo! Saya **WARDIG AI** 👋, asisten bisnis Anda. Saya siap membantu Anda mengembangkan warung dan meningkatkan penjualan! \n\nCoba tanyakan sesuatu seperti:\n- *"Bagaimana cara meningkatkan pelanggan?"*\n- *"Strategi promosi murah untuk warung"*\n- *"Cara mengelola stok agar tidak rugi"*' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setLoading(true);

        try {
            // Build conversation history for multi-turn (exclude the first greeting)
            const history = messages.slice(1).map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const res = await fetch('/api/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, message: userText })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Gagal menghubungi AI');
            }

            setMessages(prev => [...prev, { role: 'model', text: data.reply }]);
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${err.message || 'Gagal menghubungi AI. Periksa koneksi internet Anda.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    const renderText = (text: string) => {
        // Simple markdown: **bold** and *italic* and newlines
        const parts = text.split('\n');
        return parts.map((line, i) => {
            const rendered = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: rendered }} />
                    {i < parts.length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[800px]">
            {/* Header */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-md mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <Sparkles size={22} className="text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">WARDIG AI Advisor</h2>
                    <p className="text-xs text-blue-100">Konsultan bisnis warung digital Anda</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-blue-100">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'}`}>
                            {msg.role === 'user'
                                ? <User size={16} className="text-white" />
                                : <Bot size={16} className="text-white" />
                            }
                        </div>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-sm'
                        }`}>
                            {renderText(msg.text)}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className="rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-100 px-5 py-4 shadow-sm">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs">WARDIG AI sedang berpikir...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="mt-4 flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Tanyakan strategi bisnis, tips pemasaran, dll..."
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    disabled={loading}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-white shadow-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
