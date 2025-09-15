'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trash2, ArrowLeft, Wallet, TrendingUp, Building2, Plus } from 'lucide-react';
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
}

interface Wallet {
  id: string;
  userId: string;
  assets: Asset[];
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
  const totalValue = wallet?.assets?.reduce((sum, asset) => sum + (asset.quantity * asset.averagePrice), 0) || 0;

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

      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-4">
          Minha Carteira
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Gerencie seus investimentos em ações e fundos imobiliários de forma organizada.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Ativos
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <Wallet className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalAssets}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ações
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-100">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stocksCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              FIIs
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-100">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {fiisCount}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Valor Total
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <span className="text-green-600 font-bold text-sm">R$</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Table */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">Meus Ativos</CardTitle>
            <p className="text-gray-600 mt-1">Gerencie sua carteira de investimentos</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* B3 Import Button - More Prominent */}
            <div className="relative group">
              <Button 
                size="lg"
                className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white border-0 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-6 py-3 text-base font-semibold"
              >
                {/* Animated Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300 -z-10"></div>
                
                {/* B3 Logo */}
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg mr-3 shadow-md">
                  <span className="text-blue-600 font-black text-sm tracking-tight">B3</span>
                </div>
                
                {/* Button Text */}
                <span className="flex items-center">
                  Importar da B3
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </span>
                
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              </Button>
              
              {/* Tooltip/Badge */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                NOVO
              </div>
            </div>
            
            {/* Regular Add Asset Button */}
            <AddAssetDialog onAssetAdded={handleAssetAdded} />
          </div>
        </CardHeader>
        <CardContent>
          {wallet?.assets && wallet.assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Ticker</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Quantidade</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Preço Médio</th>
                    <th className="px-4 py-4 text-right text-sm font-semibold text-gray-700">Valor Total</th>
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
                      <td className="px-4 py-4 text-right text-gray-900 font-semibold">
                        R$ {(asset.quantity * asset.averagePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
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
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Wallet className="w-16 h-16 mx-auto opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Sua carteira está vazia
              </h3>
              <p className="text-gray-500 mb-6">
                Comece adicionando seus primeiros ativos para acompanhar seus investimentos.
              </p>
              <AddAssetDialog onAssetAdded={handleAssetAdded} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}