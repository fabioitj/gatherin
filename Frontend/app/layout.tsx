import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GatherIn - Notícias para Investidores',
  description: 'Sua fonte confiável de informações sobre o mercado financeiro brasileiro. Acompanhe as últimas notícias sobre ações e fundos imobiliários.',
  keywords: 'investimentos, ações, FII, fundos imobiliários, mercado financeiro, bolsa de valores',
  authors: [{ name: 'GatherIn Team' }],
  openGraph: {
    title: 'GatherIn - Notícias para Investidores',
    description: 'Sua fonte confiável de informações sobre o mercado financeiro brasileiro.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-50 to-purple-50`}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}