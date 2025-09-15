'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

const assetFormSchema = z.object({
  ticker: z.string().min(1, 'O ticker é obrigatório'),
  type: z.enum(['STOCK', 'FII']),
  quantity: z.coerce.number().int().positive('A quantidade deve ser um número positivo'),
  averagePrice: z.coerce.number().positive('O preço médio deve ser um número positivo'),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AddAssetDialogProps {
  onAssetAdded: (asset: any) => void;
}

const mockedAssets = {
  STOCK: [
    { value: 'PETR4', label: 'PETR4 - Petrobras' },
    { value: 'VALE3', label: 'VALE3 - Vale' },
    { value: 'ITUB4', label: 'ITUB4 - Itaú Unibanco' },
    { value: 'BBDC4', label: 'BBDC4 - Bradesco' },
    { value: 'ABEV3', label: 'ABEV3 - Ambev' },
  ],
  FII: [
    { value: 'MXRF11', label: 'MXRF11 - Maxi Renda' },
    { value: 'HGLG11', label: 'HGLG11 - CSHG Logística' },
    { value: 'KNRI11', label: 'KNRI11 - Kinea Renda Imobiliária' },
    { value: 'BCFF11', label: 'BCFF11 - BTG Pactual Fundo de Fundos' },
    { value: 'XPLG11', label: 'XPLG11 - XP Log' },
  ],
};

export function AddAssetDialog({ onAssetAdded }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      ticker: '',
      type: 'STOCK',
      quantity: 0,
      averagePrice: 0,
    },
  });

  const assetType = form.watch('type');

  const onSubmit = async (values: AssetFormValues) => {
    const response = await fetch('/api/wallet/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      const newAsset = await response.json();
      toast.success('Ativo adicionado com sucesso!');
      onAssetAdded(newAsset);
      form.reset();
      setOpen(false);
    } else if (response.status === 409) {
      toast.error('Este ativo já existe na sua carteira.');
    } else {
      toast.error('Falha ao adicionar o ativo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg">
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Ativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-0 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Adicionar Novo Ativo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de ativo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="STOCK">Ação</SelectItem>
                      <SelectItem value="FII">FII</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ativo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockedAssets[assetType]?.map((asset) => (
                        <SelectItem key={asset.value} value={asset.value}>
                          {asset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="averagePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Médio</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 w-full"
              >
                Adicionar Ativo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
