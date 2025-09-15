'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, Trash2 } from 'lucide-react';
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
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Carregando carteira...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-destructive">
        <p>{`Erro: ${error}`}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Por favor, faça login para ver sua carteira.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Minha Carteira</h1>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meus Ativos</CardTitle>
          <AddAssetDialog onAssetAdded={handleAssetAdded} />
        </CardHeader>
        <CardContent>
          {wallet?.assets && wallet.assets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ticker</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Quantidade</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Preço Médio</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wallet.assets.map((asset) => (
                    <tr key={asset.id}>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{asset.ticker}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{asset.type}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{asset.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">{`R$ ${asset.averagePrice.toFixed(2)}`}</td>
                      <td className="px-4 py-3 text-right">
                        <EditAssetDialog asset={asset} onAssetUpdated={handleAssetUpdated} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setAssetToDelete(asset)}>
                              <Trash2 className="w-5 h-5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o ativo de sua carteira.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setAssetToDelete(null)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAsset} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Você não possui ativos em sua carteira.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
