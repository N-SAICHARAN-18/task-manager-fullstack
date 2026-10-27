import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'TaskFlow | Modern Full-Stack Task Manager',
  description:
    'A simple, modern, and responsive full-stack task management web application built with Next.js, TypeScript, Tailwind CSS, and Supabase PostgreSQL.',
  keywords: [
    'task manager',
    'full-stack',
    'Next.js',
    'Supabase',
    'PostgreSQL',
    'TypeScript',
    'Tailwind CSS',
  ],
  authors: [{ name: 'N-SAICHARAN-18' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
