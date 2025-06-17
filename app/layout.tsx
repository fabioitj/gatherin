import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

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
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://www.infomoney.com.br" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://infomoney.com.br" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.infomoney.com.br" />
        <link rel="dns-prefetch" href="https://infomoney.com.br" />
        <link rel="preload" href="/api/news" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 font-sans`}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}