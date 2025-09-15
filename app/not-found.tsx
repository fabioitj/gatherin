'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl">
            <FileQuestion className="w-12 h-12 text-purple-600" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Página não encontrada
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida. 
          Verifique o endereço digitado ou retorne à página inicial.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Home className="w-5 h-5 mr-2" />
              Ir para início
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
        </div>
        
        <div className="mt-12 p-6 bg-purple-50 rounded-2xl border border-purple-100">
          <h2 className="text-lg font-semibold text-purple-900 mb-2">
            Precisa de ajuda?
          </h2>
          <p className="text-purple-700">
            Explore nossas <Link href="/" className="underline hover:text-purple-900">notícias mais recentes</Link> ou 
            saiba mais <Link href="/sobre" className="underline hover:text-purple-900">sobre nossa plataforma</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}