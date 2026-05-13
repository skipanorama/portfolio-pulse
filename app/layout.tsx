import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PortfolioPulse',
  description: 'AI-powered stock portfolio analyzer',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`} suppressHydrationWarning>
      <body className="h-full bg-[hsl(222,47%,7%)] text-[hsl(213,31%,91%)] antialiased">
        <div className="flex h-full">
          <Sidebar />
          <main className="flex-1 overflow-auto lg:pl-64">
            <div className="min-h-full p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
