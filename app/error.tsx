'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Algo deu errado
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Ocorreu um erro inesperado. Tente recarregar a página ou volte mais tarde.
        </p>
        
        <Alert variant="destructive" className="mb-8 text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Erro interno do servidor'}
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={reset}
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Tentar novamente
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = '/'}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
}