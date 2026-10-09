import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'code-sensei 🔍 — Instant senior-level code review',
  description: 'Paste your code and get a senior developer review in milliseconds: bugs, cyclomatic complexity, code smells and concrete fixes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
