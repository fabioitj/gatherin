import Link from 'next/link';
import { TrendingUp, Heart } from 'lucide-react';
import { memo } from 'react';

function FooterComponent() {
  return (
    <footer 
      className="bg-gray-900 text-white" 
      style={{ 
        contentVisibility: 'auto',
        containIntrinsicSize: '0 400px'
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">GatherIn</h2>
                <p className="text-sm text-gray-400">Notícias para investidores</p>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Sua fonte confiável de informações sobre o mercado financeiro brasileiro. 
              Acompanhe as últimas notícias sobre ações e fundos imobiliários.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Links rápidos</h3>
            <nav className="space-y-2">
              <Link href="/" className="block text-gray-400 hover:text-white transition-colors duration-200">
                Página inicial
              </Link>
              <Link href="/sobre" className="block text-gray-400 hover:text-white transition-colors duration-200">
                Sobre o GatherIn
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações</h3>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>Plataforma de notícias financeiras</p>
              <p>Focada no mercado brasileiro</p>
              <p>Dados atualizados em tempo real</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 GatherIn. Todos os direitos reservados.
          </p>
          <p className="text-gray-400 text-sm flex items-center mt-4 md:mt-0">
            Feito com <Heart className="w-4 h-4 mx-1 text-red-500" /> para investidores brasileiros
          </p>
        </div>
      </div>
    </footer>
  );
}

export const Footer = memo(FooterComponent);