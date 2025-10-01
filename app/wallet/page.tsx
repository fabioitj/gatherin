'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trash2, ArrowLeft, Wallet, TrendingUp, Building2, Plus, Search } from 'lucide-react';
import { AddAssetDialog } from '@/components/AddAssetDialog';
import { EditAssetDialog } from '@/components/EditAssetDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Define types for Wallet and Asset
interface Asset {
  id: string;
  ticker: string;
  type: 'STOCK' | 'FII';
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  currentValue?: number;
  totalInvested?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
}

interface Wallet {
  id: string;
  userId: string;
  assets: Asset[];
  totalValue?: number;
  totalInvested?: number;
  totalGainLoss?: number;
  totalGainLossPercentage?: number;
}

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/login?callbackUrl=/wallet');
      return;
    }
  }, [session, status, router]);

  const fetchWallet = () => {
    if (status === 'authenticated') {
      setLoading(true);
      fetch('/api/wallet')
        .then((res) => {
          if (!res.ok) {
            throw new Error('Falha ao buscar a carteira');
          }
          return res.json();
        })
        .then((data) => {
          setWallet(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [status]);

  const handleAssetAdded = (newAsset: Asset) => {
    if (wallet) {
      setWallet({
        ...wallet,
        assets: [...wallet.assets, newAsset].sort((a, b) => a.ticker.localeCompare(b.ticker)),
      });
    } else {
      setWallet({ id: '', userId: session?.user?.id || '', assets: [newAsset] });
    }
  };

  const handleAssetUpdated = (updatedAsset: Asset) => {
    if (wallet) {
      setWallet({
        ...wallet,
        assets: wallet.assets.map((asset) =>
          asset.id === updatedAsset.id ? updatedAsset : asset
        ),
      });
    }
  };

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;

    const response = await fetch(`/api/wallet/assets/${assetToDelete.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      if (wallet) {
        setWallet({
          ...wallet,
          assets: wallet.assets.filter((asset) => asset.id !== assetToDelete.id),
        });
      }
      toast.success('Ativo excluído com sucesso!');
      setAssetToDelete(null);
    } else {
      toast.error('Falha ao excluir o ativo.');
    }
  };

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session?.user) {
    return null;
  }

  if (loading && !wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Carregando carteira...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-red-500 mb-4">
            <Wallet className="w-16 h-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Erro ao carregar carteira
          </h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button 
            onClick={fetchWallet}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const totalAssets = wallet?.assets?.length || 0;
  const stocksCount = wallet?.assets?.filter(asset => asset.type === 'STOCK').length || 0;
  const fiisCount = wallet?.assets?.filter(asset => asset.type === 'FII').length || 0;
  const totalCurrentValue = wallet?.totalValue || 0;
  const totalInvested = wallet?.totalInvested || 0;
  const totalGainLoss = wallet?.totalGainLoss || 0;
  const totalGainLossPercentage = wallet?.totalGainLossPercentage || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Link href="/news">
          <Button variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para início
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
            <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4 px-4">
          Minha Carteira
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
          Gerencie seus investimentos em ações e fundos imobiliários de forma organizada.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-4 lg:gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs font-medium text-gray-600">
              Total de Ativos
            </CardTitle>
            <div className="p-1 rounded-lg bg-blue-100">
              <Wallet className="w-3 h-3 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {totalAssets}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs font-medium text-gray-600">
              Ações
            </CardTitle>
            <div className="p-1 rounded-lg bg-purple-100">
              <TrendingUp className="w-3 h-3 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {stocksCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs font-medium text-gray-600">
              FIIs
            </CardTitle>
            <div className="p-1 rounded-lg bg-indigo-100">
              <Building2 className="w-3 h-3 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              {fiisCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs font-medium text-gray-600">
              Valor Total
            </CardTitle>
            <div className="p-1 rounded-lg bg-green-100">
              <span className="text-green-600 font-bold text-xs">R$</span>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">
              R$ {totalCurrentValue.toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg bg-white/80 backdrop-blur-sm ${
          totalGainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-4 lg:p-6">
            <CardTitle className="text-xs font-medium text-gray-600">
              Ganho/Perda
            </CardTitle>
            <div className={`p-1 rounded-lg ${totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <span className={`font-bold text-xs ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}%
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4 lg:p-6 pt-0">
            <div className={`text-sm sm:text-lg lg:text-xl font-bold ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {totalGainLoss >= 0 ? '+' : ''}R$ {Math.abs(totalGainLoss).toLocaleString('pt-BR', { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className={`text-xs ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Performance Card */}
      
      {/* Quick Actions for Portfolio - Only show when user has assets */}
      {wallet?.assets && wallet.assets.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link href="/recommendations">
            <Button 
              variant="outline" 
              className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50"
            >
              💡 Ver Recomendações Personalizadas
            </Button>
          </Link>
          <Link href="/?search=&wallet=true">
            <Button 
              variant="outline" 
              className="border-purple-200 text-purple-700 hover:bg-purple-50 bg-purple-50/50"
            >
              📰 Notícias da Minha Carteira
            </Button>
          </Link>
        </div>
      )}

      {/* Assets Table */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">Meus Ativos</CardTitle>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie sua carteira de investimentos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            {/* B3 Import Button */}
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <div className="flex items-center justify-center w-5 h-5 bg-white rounded mr-2">
                <span className="text-blue-600 font-bold text-xs">B3</span>
              </div>
              Adicionar Carteira
            </Button>
            
            {/* Regular Add Asset Button */}
            <AddAssetDialog onAssetAdded={handleAssetAdded} />
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {wallet?.assets && wallet.assets.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Ticker</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Quantidade</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Preço Médio</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Preço Atual</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Valor Atual</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Ganho/Perda</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {wallet.assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">{asset.ticker}</div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge 
                            variant="secondary" 
                            className={`${
                              asset.type === 'STOCK' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            } font-medium`}
                          >
                            {asset.type === 'STOCK' ? 'Ação' : 'FII'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 font-medium">
                          {asset.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 font-medium">
                          R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-700 font-medium">
                          {asset.currentPrice ? (
                            `R$ ${asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900 font-semibold">
                          R$ {(asset.currentValue || (asset.quantity * asset.averagePrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {asset.gainLoss !== undefined ? (
                            <div className="text-right">
                              <div className={`${asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {asset.gainLoss >= 0 ? '+' : ''}R$ {Math.abs(asset.gainLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className={`text-xs ${asset.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {asset.gainLoss >= 0 ? '+' : ''}{asset.gainLossPercentage?.toFixed(2)}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/?search=${encodeURIComponent(asset.ticker)}`}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title={`Buscar notícias sobre ${asset.ticker}`}
                              >
                                <Search className="w-4 h-4" />
                              </Button>
                            </Link>
                            <EditAssetDialog asset={asset} onAssetUpdated={handleAssetUpdated} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setAssetToDelete(asset)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir <strong>{asset.ticker}</strong> da sua carteira? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setAssetToDelete(null)}>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={handleDeleteAsset} 
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {wallet.assets.map((asset) => (
                  <Card key={asset.id} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="font-bold text-lg text-gray-900">{asset.ticker}</div>
                          <Badge 
                            variant="secondary" 
                            className={`${
                              asset.type === 'STOCK' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            } font-medium text-xs`}
                          >
                            {asset.type === 'STOCK' ? 'Ação' : 'FII'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href={`/?search=${encodeURIComponent(asset.ticker)}`}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                              title={`Buscar notícias sobre ${asset.ticker}`}
                            >
                              <Search className="w-4 h-4" />
                            </Button>
                          </Link>
                          <EditAssetDialog asset={asset} onAssetUpdated={handleAssetUpdated} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setAssetToDelete(asset)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir <strong>{asset.ticker}</strong> da sua carteira? 
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setAssetToDelete(null)}>
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteAsset} 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Quantidade:</span>
                          <div className="font-medium text-gray-900">{asset.quantity.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Preço Médio:</span>
                          <div className="font-medium text-gray-900">
                            R$ {asset.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Preço Atual:</span>
                          <div className="font-medium text-gray-900">
                            {asset.currentPrice ? (
                              `R$ ${asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Ganho/Perda:</span>
                          {asset.gainLoss !== undefined ? (
                            <div>
                              <div className={`font-medium ${asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {asset.gainLoss >= 0 ? '+' : ''}R$ {Math.abs(asset.gainLoss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className={`text-xs ${asset.gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {asset.gainLoss >= 0 ? '+' : ''}{asset.gainLossPercentage?.toFixed(2)}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-sm">Valor Total:</span>
                          <div className="font-bold text-lg text-gray-900">
                            R$ {(asset.currentValue || (asset.quantity * asset.averagePrice)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-gray-400 mb-4">
                <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                Sua carteira está vazia
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">
                Comece adicionando seus primeiros ativos para acompanhar seus investimentos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center px-4">
                {/* B3 Import Button for Empty State */}
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded mr-2">
                    <span className="text-blue-600 font-bold text-xs">B3</span>
                  </div>
                  Adicionar Carteira
                </Button>
                <AddAssetDialog onAssetAdded={handleAssetAdded} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}