'use client';

/**
 * Web Speech API wrapper.
 *
 * We use the native `speechSynthesis` API on the client rather than streaming
 * audio from ElevenLabs for the MVP — it's free, works offline, and arrives
 * in every browser without an extra round-trip. The interface keeps an
 * ElevenLabs swap straightforward: replace `speak()` with a fetch + audio
 * element, keep the same promise-resolves-when-done contract.
 */

export interface SpeakOptions {
  text: string;
  /** IETF language tag (e.g. "en-US", "nb-NO"). */
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceURI?: string;
}

export function speak(opts: SpeakOptions): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(opts.text);
    if (opts.lang) u.lang = opts.lang;
    if (opts.rate) u.rate = opts.rate;
    if (opts.pitch) u.pitch = opts.pitch;
    if (opts.voiceURI) {
      const v = window.speechSynthesis
        .getVoices()
        .find((vv) => vv.voiceURI === opts.voiceURI);
      if (v) u.voice = v;
    }
    u.onend = () => resolve();
    u.onerror = () => resolve(); // never reject — narration is best-effort
    window.speechSynthesis.speak(u);
  });
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

/**
 * Hold a visual for a minimum duration AND wait for narration to finish.
 * Whichever ends last wins — that's the right behaviour: don't cut speech
 * short, but also don't end the visual before its animation has had time to
 * communicate something.
 */
export async function holdSegment(
  narrationP: Promise<void>,
  minSeconds: number
): Promise<void> {
  const minP = new Promise<void>((res) => setTimeout(res, minSeconds * 1000));
  await Promise.all([narrationP, minP]);
}
