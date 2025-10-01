'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader as Loader2, ArrowLeft, Lightbulb, TrendingUp, Users, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RecommendationCardSkeleton } from '@/components/skeletons/RecommendationCardSkeleton';

interface Recommendation {
  id: string;
  baseAsset: string;
  recommendedAsset: string;
  similarityScore: number;
  support: number;
  confidence: number;
  usersWithBoth: number;
  usersWithBase: number;
  percentageAlsoInvest: number;
  recommendationStrength: number;
  message: string;
  createdAt: string;
  updatedAt: string;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  total: number;
  userAssets: string[];
  filters: {
    limit: number;
    minConfidence: number;
  };
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recommendations/personalized', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar recomendações');
      }
      
      const data = await response.json();
      setRecommendations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchRecommendations();
    }
  }, [session]);

  // Don't render anything if not authenticated (will redirect)
  if (status === 'loading' || !session?.user) {
    return null;
  }

  const showSkeletons = loading && !recommendations;

  if (error && !recommendations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>
            {error}. Tente recarregar a página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStrengthColor = (strength: number) => {
    if (strength >= 0.7) return 'text-green-600 bg-green-100';
    if (strength >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 0.7) return 'Alta';
    if (strength >= 0.5) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/wallet">
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para carteira
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent mb-4">
          Recomendações Personalizadas
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Baseadas no comportamento de investidores com perfil similar ao seu.
        </p>
      </div>

      {/* User Assets Summary */}
      {recommendations && recommendations.userAssets.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Sua Carteira Atual
          </h2>
          <div className="flex flex-wrap gap-2">
            {recommendations.userAssets.map((asset) => (
              <Badge key={asset} variant="secondary" className="bg-blue-100 text-blue-800 font-medium">
                {asset}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showSkeletons ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analisando sua carteira...</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecommendationCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : !recommendations || recommendations.recommendations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Lightbulb className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Nenhuma recomendação encontrada
          </h3>
          <p className="text-gray-500 mb-6">
            {recommendations?.userAssets.length === 0 
              ? 'Adicione alguns ativos à sua carteira para receber recomendações personalizadas.'
              : 'Não encontramos recomendações baseadas na sua carteira atual. Tente adicionar mais ativos.'
            }
          </p>
          <Link href="/wallet">
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              Gerenciar carteira
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
              Recomendações para Você
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {recommendations.total} recomendação{recommendations.total !== 1 ? 'ões' : ''}
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {recommendations.recommendations.map((rec) => (
              <Card key={rec.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        <span className="text-blue-600">{rec.baseAsset}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-green-600">{rec.recommendedAsset}</span>
                      </CardTitle>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {rec.message}
                      </p>
                    </div>
                    <Badge 
                      className={`ml-4 ${getStrengthColor(rec.recommendationStrength)} border-0 font-medium`}
                    >
                      {getStrengthLabel(rec.recommendationStrength)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Confidence Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Confiança</span>
                        <span className="text-sm font-bold text-gray-900">
                          {rec.percentageAlsoInvest.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={rec.percentageAlsoInvest} 
                        className="h-2"
                      />
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <Users className="w-4 h-4 text-gray-600 mr-1" />
                        </div>
                        <div className="text-lg font-bold text-gray-900">{rec.usersWithBoth}</div>
                        <div className="text-xs text-gray-600">Usuários com ambos</div>
                      </div>
                      
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-1">
                          <TrendingUp className="w-4 h-4 text-gray-600 mr-1" />
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {(rec.similarityScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Similaridade</div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                        asChild
                      >
                        <Link href={`/news?search=${encodeURIComponent(rec.recommendedAsset)}`}>
                          Pesquisar {rec.recommendedAsset}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Como funcionam as recomendações?
            </h3>
            <div className="text-purple-800 text-sm space-y-2">
              <p>
                • <strong>Análise de Similaridade:</strong> Comparamos sua carteira com a de outros investidores
              </p>
              <p>
                • <strong>Padrões de Comportamento:</strong> Identificamos ativos frequentemente investidos juntos
              </p>
              <p>
                • <strong>Confiança:</strong> Percentual de investidores que possuem ambos os ativos
              </p>
              <p>
                • <strong>Atualização:</strong> Recomendações são atualizadas periodicamente com novos dados
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}