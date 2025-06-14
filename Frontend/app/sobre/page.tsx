import Link from 'next/link';
import { TrendingUp, Target, Users, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SobrePage() {
  const features = [
    {
      icon: Target,
      title: 'Foco no Mercado Brasileiro',
      description: 'Especializados em notícias sobre ações e fundos imobiliários do mercado nacional, trazendo informações relevantes para investidores brasileiros.'
    },
    {
      icon: Users,
      title: 'Para Todos os Investidores',
      description: 'Desde iniciantes até experientes, nossa plataforma oferece conteúdo acessível e informativo para todos os níveis de conhecimento.'
    },
    {
      icon: Shield,
      title: 'Informação Confiável',
      description: 'Agregamos notícias de fontes respeitadas do mercado financeiro, garantindo a qualidade e veracidade das informações.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para início
          </Button>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl shadow-xl">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-6">
            Sobre o GatherIn
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Uma plataforma dedicada a conectar investidores brasileiros com as informações 
            mais relevantes do mercado financeiro nacional.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Nossa Missão
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
            O GatherIn foi criado com o objetivo de democratizar o acesso à informação financeira 
            de qualidade. Acreditamos que todo investidor brasileiro merece ter acesso a notícias 
            confiáveis e atualizadas sobre o mercado de ações e fundos imobiliários, apresentadas 
            de forma clara e organizada.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl mx-auto mb-4">
                    <Icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* What We Offer */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            O que oferecemos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-purple-700">
                📈 Notícias sobre Ações
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Acompanhe as últimas movimentações do mercado acionário brasileiro, 
                análises de empresas, resultados trimestrais e tendências setoriais.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-indigo-700">
                🏢 Informações sobre FIIs
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Mantenha-se atualizado sobre o mercado de fundos imobiliários, 
                dividendos, novos lançamentos e análises do setor imobiliário.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12 border-0">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Tecnologia e Confiabilidade
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center max-w-3xl mx-auto mb-8">
            Nossa plataforma utiliza tecnologias modernas para garantir a melhor experiência do usuário, 
            com carregamento rápido, design responsivo e informações sempre atualizadas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Next.js
            </span>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              PostgreSQL
            </span>
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              Prisma ORM
            </span>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-medium">
              TypeScript
            </span>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-3xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-4">
            Comece a investir com mais conhecimento
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Explore nossa plataforma e mantenha-se sempre informado sobre o mercado financeiro brasileiro.
          </p>
          <Link href="/">
            <Button size="lg" variant="secondary" className="bg-white text-purple-700 hover:bg-gray-100 font-semibold">
              Explorar notícias
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}