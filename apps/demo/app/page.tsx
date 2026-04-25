'use client';

import { useChat } from '@ai-sdk/react';
import { GenUIRenderer } from '@/components/GenUIRenderer';
import { parseComponentSpec } from '@/lib/parseComponentSpec';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <main className="flex flex-col h-screen">
      {/* Visual canvas — takes up most of the screen */}
      <div className="flex-1 relative overflow-hidden">
        {messages
          .filter((m) => m.role === 'assistant')
          .map((m) => {
            const spec = parseComponentSpec(m.content);
            return spec ? (
              <GenUIRenderer key={m.id} spec={spec} />
            ) : (
              <div key={m.id} className="p-6 text-gray-300 text-lg max-w-2xl mx-auto mt-12">
                {m.content}
              </div>
            );
          })}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-white/10 p-4 flex gap-3"
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask anything — the interface will come alive..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-white text-black font-semibold rounded-xl disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </main>
  );
}
