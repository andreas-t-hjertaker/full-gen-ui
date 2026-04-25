import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'full-gen-ui · studio',
  description:
    'Visual designer for the full-gen-ui component catalog — browse, tweak parameters, and export specs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
    </html>
  );
}
