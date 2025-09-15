'use client';

import { useState, useEffect } from 'react';
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
import { PlusCircle, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

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

interface Asset {
  stock: string;
  name: string;
}

export function AddAssetDialog({ onAssetAdded }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  useEffect(() => {
    const fetchAssets = async () => {
      if (searchQuery.length > 1) {
        const type = assetType === 'STOCK' ? 'stock' : 'fund';
        const response = await fetch(`/api/assets/search?type=${type}&search=${searchQuery}`);
        if (response.ok) {
          const data = await response.json();
          setAssets(data);
        }
      } else {
        setAssets([]);
      }
    };

    const debounce = setTimeout(() => {
      fetchAssets();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, assetType]);

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
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('ticker', '');
                    setAssets([]);
                    setSearchQuery('');
                  }} defaultValue={field.value}>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Ticker</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value
                            ? assets.find((asset) => asset.stock === field.value)?.name || field.value
                            : 'Selecione o ativo'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command filter={() => 1}>
                        <CommandInput
                          placeholder="Procurar ativo..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandEmpty>Nenhum ativo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {assets.map((asset) => (
                            <CommandItem
                              value={asset.stock}
                              key={asset.stock}
                              onSelect={() => {
                                field.onChange(asset.stock);
                                setComboboxOpen(false);
                              }}
                            >
                              {asset.stock} - {asset.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
