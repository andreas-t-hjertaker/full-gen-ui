import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'full-gen-ui demo',
  description: 'LLM-orchestrated, GPU-rendered living visual UI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
