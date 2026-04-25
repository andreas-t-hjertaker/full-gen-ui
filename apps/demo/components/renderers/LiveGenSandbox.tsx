'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveGenSpec } from '@/lib/schemas';

/**
 * LiveGenSandbox: renders LLM-generated JSX/Canvas code inside a sandboxed iframe.
 * Security: sandbox="allow-scripts" only — no allow-same-origin.
 * The iframe cannot access window.parent, localStorage, or the host DOM.
 */
export function LiveGenSandbox({ spec }: { spec: LiveGenSpec }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const iframe = iframeRef.current;
    if (!iframe) return;

    const srcdoc = buildSrcdoc(spec);
    iframe.srcdoc = srcdoc;

    const onMessage = (e: MessageEvent) => {
      // Only accept messages from our iframe
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'error') {
        setError(e.data.message);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [spec]);

  return (
    <div className="absolute inset-0 flex flex-col">
      {error && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-red-900/80 text-red-200 text-xs px-3 py-2 rounded-lg font-mono">
          {error}
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="flex-1 w-full border-0 bg-transparent"
        // Security: allow-scripts only — critically NOT allow-same-origin
        sandbox="allow-scripts"
        title="live-gen-sandbox"
        loading="eager"
      />
    </div>
  );
}

function buildSrcdoc(spec: LiveGenSpec): string {
  const runtime = spec.runtime ?? 'canvas';

  if (runtime === 'canvas') {
    return buildCanvasSrcdoc(spec.code, spec.backgroundColor ?? '#000000');
  }

  // React/JSX runtime via Babel standalone + esm.sh CDN
  return buildReactSrcdoc(spec.code, spec.backgroundColor ?? '#000000');
}

function buildCanvasSrcdoc(code: string, bg: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${bg}; overflow: hidden; width: 100vw; height: 100vh; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
window.onerror = (msg) => parent.postMessage({ type: 'error', message: msg }, '*');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);
try {
${code}
} catch(e) {
  parent.postMessage({ type: 'error', message: e.message }, '*');
}
</script>
</body>
</html>`;
}

function buildReactSrcdoc(code: string, bg: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: ${bg}; overflow: hidden; width: 100vw; height: 100vh; }
  #root { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19",
    "react-dom/client": "https://esm.sh/react-dom@19/client"
  }
}
</script>
<script>
window.onerror = (msg) => parent.postMessage({ type: 'error', message: msg }, '*');
</script>
<script type="text/babel" data-type="module" data-presets="react">
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
try {
${code}
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
} catch(e) {
  parent.postMessage({ type: 'error', message: e.message }, '*');
}
</script>
</body>
</html>`;
}
