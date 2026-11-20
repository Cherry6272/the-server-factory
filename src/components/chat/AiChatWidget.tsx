'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  Cpu,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

const STARTER_PROMPTS = [
  '⚡ Spec an AI & Deep Learning Server',
  '🖥️ Virtualization Server for Proxmox/ESXi',
  '💾 High-Capacity Storage / NAS Server',
  '📞 How do I get a custom quote or talk to sales?',
];

const INITIAL_WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hello! I'm **The Server Factory AI**, your hardware solutions specialist. I can help you choose the ideal enterprise server, workstation, or component architecture for your workload.\n\nWhat kind of workload or hardware are you planning for?",
  createdAt: Date.now(),
};

export function AiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  // Restore messages from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('tsf_ai_chat');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save messages to sessionStorage
  useEffect(() => {
    if (messages.length > 1) {
      try {
        sessionStorage.setItem('tsf_ai_chat', JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        signal: AbortSignal.timeout(8500),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content:
          data?.reply ||
          'For immediate assistance or tailored quotes, please call our engineers at **+91 99160 48404** or email **sales@theserverfactory.com**.',
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content:
            "I'm temporarily unable to reach the server. Please call or WhatsApp our engineers directly at **+91 99160 48404** or email **sales@theserverfactory.com**.",
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([INITIAL_WELCOME]);
    try {
      sessionStorage.removeItem('tsf_ai_chat');
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* ── Floating Launcher Button ─────────────────────── */}
      <div className="fixed bottom-5 right-5 z-40 sm:bottom-6 sm:right-6">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open AI Hardware Assistant"
            className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand via-brand-600 to-brand px-4 py-3 text-white shadow-[0_8px_28px_rgba(0,102,204,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_36px_rgba(0,102,204,0.6)] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:focus:ring-offset-navy-950 sm:px-5 sm:py-3.5"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-techgreen opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-techgreen" />
            </span>
            <Sparkles className="h-4 w-4 animate-pulse text-techgreen" />
            <span className="text-xs font-bold tracking-wide sm:text-sm">Ask AI Hardware Specialist</span>
            {hasUnread && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                1
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── Chat Modal Window ────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-3 right-3 z-50 flex h-[580px] max-h-[92vh] w-[95vw] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.35)] transition-all duration-200 dark:border-navy-700 dark:bg-[#07192f] sm:bottom-6 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-navy-900 to-[#07192f] px-4 py-3 text-white dark:border-navy-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand-300 border border-brand/40">
                <Cpu className="h-5 w-5 text-techgreen" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-sm font-bold text-white">Server Factory AI</h3>
                  <span className="inline-block h-2 w-2 rounded-full bg-techgreen" title="Online" />
                </div>
                <p className="truncate text-[11px] text-gray-300">Hardware Solutions Architect</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset conversation"
                className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="rounded-lg p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50 dark:bg-[#051325]">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-300">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:text-[13px] ${
                      isUser
                        ? 'bg-brand text-white rounded-br-sm shadow-sm'
                        : 'border border-gray-200 bg-white text-ink rounded-bl-sm shadow-soft dark:border-navy-700/80 dark:bg-navy-900/90 dark:text-gray-100'
                    }`}
                  >
                    <MessageContent content={m.content} isUser={isUser} onLinkClick={() => setIsOpen(false)} />
                  </div>
                </div>
              );
            })}

            {/* Quick chips (only visible when conversation is fresh) */}
            {messages.length <= 1 && (
              <div className="pt-2">
                <p className="mb-2 text-[11px] font-semibold text-ink-muted dark:text-gray-400">
                  Quick topics to get started:
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs text-ink transition hover:border-brand hover:bg-brand-50/50 dark:border-navy-700 dark:bg-navy-900/60 dark:text-gray-200 dark:hover:border-brand dark:hover:bg-navy-800/80"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading typing indicator */}
            {loading && (
              <div className="flex items-center gap-2 justify-start">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand dark:bg-brand/20 dark:text-brand-300">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5 shadow-soft dark:border-navy-700 dark:bg-navy-900">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-brand" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-gray-100 bg-white p-3 dark:border-navy-800 dark:bg-[#07192f]"
          >
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about servers, GPUs, RAID, custom specs..."
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-3.5 pr-11 text-xs outline-none transition focus:border-brand focus:bg-white dark:border-navy-700 dark:bg-navy-950/70 dark:text-gray-100 dark:focus:bg-navy-950 sm:text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white transition hover:bg-brand-600 disabled:opacity-30 disabled:hover:bg-brand"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-ink-muted dark:text-gray-400">
              Powered by Google Gemini · Free technical advisory
            </p>
          </form>
        </div>
      )}
    </>
  );
}

/** Simple, safe markdown renderer for bold, lists, and links */
function MessageContent({ content, isUser, onLinkClick }: { content: string; isUser: boolean; onLinkClick: () => void }) {
  if (isUser) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Parse lines
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Headings: ### Title or ## Title
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
          const headingText = trimmed.replace(/^#{2,3}\s+/, '');
          return (
            <div key={idx} className="pt-1 pb-0.5 font-bold text-ink dark:text-white">
              {renderFormattedText(headingText, onLinkClick)}
            </div>
          );
        }

        // Numbered list: 1. Item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="flex-shrink-0 font-bold text-brand dark:text-brand-300">{numMatch[1]}.</span>
              <div>{renderFormattedText(numMatch[2], onLinkClick)}</div>
            </div>
          );
        }

        // Bullet points
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-techgreen" />
              <div>{renderFormattedText(trimmed.slice(2), onLinkClick)}</div>
            </div>
          );
        }

        return <div key={idx}>{renderFormattedText(line, onLinkClick)}</div>;
      })}
    </div>
  );
}

function renderFormattedText(text: string, onLinkClick: () => void) {
  // Regex to match markdown links: [text](url) and bold **bold**
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let keyCounter = 0;

  // Replace links and bold
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
  let match;
  let lastIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      // It's a link: [text](url)
      const label = match[2];
      const url = match[3];
      const isInternal = url.startsWith('/');

      parts.push(
        isInternal ? (
          <Link
            key={`link-${keyCounter++}`}
            href={url}
            onClick={onLinkClick}
            className="font-semibold text-brand underline decoration-brand/40 underline-offset-2 hover:text-brand-400"
          >
            {label}
          </Link>
        ) : (
          <a
            key={`ext-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 font-semibold text-brand underline decoration-brand/40 underline-offset-2 hover:text-brand-400"
          >
            {label}
            <ExternalLink className="inline h-3 w-3" />
          </a>
        )
      );
    } else if (match[4]) {
      // It's bold: **text**
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-bold text-ink dark:text-white">
          {match[4]}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

