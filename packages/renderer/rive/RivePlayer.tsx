'use client';

import dynamic from 'next/dynamic';
import type { RiveAnimationSpec } from './schemas';

// @rive-app/react-canvas hits WebGL/canvas APIs at module scope and must be
// pulled in client-side only. The dynamic split also ensures Next's edge/SSR
// build doesn't try to parse it.
const RivePlayerInner = dynamic(() => import('./RivePlayerInner'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

export function RivePlayer({ spec }: { spec: RiveAnimationSpec }) {
  return <RivePlayerInner spec={spec} />;
}
