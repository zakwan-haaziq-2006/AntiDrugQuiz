import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Anti-Drug Club Quiz Competition Platform',
  description: 'Production-ready online quiz competition platform for college Anti-Drug Club awareness events.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-white text-neutral-900 antialiased min-h-screen selection:bg-neutral-200 selection:text-neutral-900">
        {children}
      </body>
    </html>
  );
}
