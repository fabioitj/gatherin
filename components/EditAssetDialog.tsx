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
import { Edit } from 'lucide-react';
import { toast } from 'sonner';

const assetFormSchema = z.object({
  quantity: z.coerce.number().int().positive('A quantidade deve ser um número positivo'),
  averagePrice: z.coerce.number().positive('O preço médio deve ser um número positivo'),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface EditAssetDialogProps {
  asset: {
    id: string;
    ticker: string;
    type: 'STOCK' | 'FII';
    quantity: number;
    averagePrice: number;
  };
  onAssetUpdated: (updatedAsset: any) => void;
}

export function EditAssetDialog({ asset, onAssetUpdated }: EditAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      quantity: asset.quantity,
      averagePrice: asset.averagePrice,
    },
  });

  const onSubmit = async (values: AssetFormValues) => {
    const response = await fetch(`/api/wallet/assets/${asset.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });

    if (response.ok) {
      const updatedAsset = await response.json();
      toast.success('Ativo atualizado com sucesso!');
      onAssetUpdated(updatedAsset);
      setOpen(false);
    } else {
      toast.error('Falha ao atualizar o ativo.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-5 h-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{`Editar Ativo: ${asset.ticker}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
