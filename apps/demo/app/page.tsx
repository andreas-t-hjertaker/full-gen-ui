'use client';

import { useChat } from '@ai-sdk/react';
import { GenUIRenderer } from '@/components/GenUIRenderer';
import { parseComponentSpec } from '@/lib/parseComponentSpec';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      {/* Visual canvas — full screen, last message wins */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {assistantMessages.length === 0 && !isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
            <div className="text-6xl font-thin tracking-widest">full-gen-ui</div>
            <div className="text-sm uppercase tracking-[0.3em]">
              Ask anything. The interface comes alive.
            </div>
          </div>
        )}

        {assistantMessages.map((m) => {
          const spec = parseComponentSpec(m);
          return spec ? (
            <GenUIRenderer key={m.id} spec={spec} />
          ) : m.content ? (
            <div
              key={m.id}
              className="absolute inset-0 flex items-center justify-center p-12"
            >
              <p className="text-white/70 text-2xl font-light leading-relaxed max-w-2xl text-center">
                {m.content}
              </p>
            </div>
          ) : null;
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 bg-black/80 backdrop-blur-sm p-4 flex gap-3 items-center"
      >
        {/* Message history preview */}
        {messages.filter((m) => m.role === 'user').slice(-1).map((m) => (
          <span key={m.id} className="text-white/30 text-sm truncate max-w-[200px] hidden sm:block">
            {typeof m.content === 'string' ? m.content : ''}
          </span>
        ))}

        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything — the interface will come alive..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-white/30 text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-white text-black text-sm font-semibold rounded-xl disabled:opacity-30 hover:bg-white/90 transition-colors"
        >
          ↑
        </button>
      </form>
    </main>
  );
}
