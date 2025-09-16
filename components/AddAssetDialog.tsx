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
import { PlusCircle, ChevronsUpDown, Check, Search, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const assetFormSchema = z.object({
  ticker: z.string().min(1, 'O ticker é obrigatório'),
  type: z.enum(['STOCK', 'FII']),
  quantity: z.coerce.number().int().positive('A quantidade deve ser um número positivo'),
  averagePrice: z.string()
    .min(1, 'O preço médio é obrigatório')
    .transform((val) => {
      // Handle Brazilian decimal format (comma as decimal separator)
      const normalizedValue = val.replace(',', '.');
      const parsed = parseFloat(normalizedValue);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('O preço médio deve ser um número positivo');
      }
      return parsed;
    }),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AddAssetDialogProps {
  onAssetAdded: (asset: any) => void;
}

interface LocalAsset {
  stock: string;
  name: string;
  close?: number;
  change?: number;
  volume?: number;
  market_cap?: number;
  logo?: string;
  sector?: string;
  type: string;
}

interface LocalAssetResponse {
  stocks: LocalAsset[];
  totalCount: number;
  hasNextPage: boolean;
  currentPage: number;
  totalPages: number;
  source: string;
}

export function AddAssetDialog({ onAssetAdded }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<LocalAsset | null>(null);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      ticker: '',
      type: 'STOCK',
      quantity: 0,
      averagePrice: '',
    },
  });

  const assetType = form.watch('type');

  // Fetch assets from local database
  useEffect(() => {
    const fetchAssets = async () => {
      if (searchQuery.length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(`/api/assets/search?type=${assetType}&search=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data: LocalAssetResponse = await response.json();
            setAssets(data.stocks || []);
          } else {
            console.error('Failed to fetch assets from local database:', response.status);
            setAssets([]);
          }
        } catch (error) {
          console.error('Error fetching assets from local database:', error);
          setAssets([]);
        } finally {
          setLoading(false);
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

  // Reset form when asset type changes
  useEffect(() => {
    form.setValue('ticker', '');
    setSelectedAsset(null);
    setAssets([]);
    setSearchQuery('');
  }, [assetType, form]);

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
      setSelectedAsset(null);
      setAssets([]);
      setSearchQuery('');
      setOpen(false);
    } else if (response.status === 409) {
      toast.error('Este ativo já existe na sua carteira.');
    } else {
      toast.error('Falha ao adicionar o ativo.');
    }
  };

  const handleAssetSelect = (asset: LocalAsset) => {
    setSelectedAsset(asset);
    form.setValue('ticker', asset.stock);
    setComboboxOpen(false);
    
    // Auto-fill average price if available
    if (asset.close && asset.close > 0) {
      form.setValue('averagePrice', formatPriceInput(asset.close));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPriceInput = (price: number) => {
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true
    });
  };
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg">
          <PlusCircle className="w-4 h-4 mr-2" />
          Adicionar Ativo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] border-0 shadow-xl">
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
                <FormItem className="flex flex-col">
                  <FormLabel>Ativo</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between h-auto min-h-[40px] p-3',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {selectedAsset ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-3">
                                {selectedAsset.logo && (
                                  <img 
                                    src={selectedAsset.logo} 
                                    alt={selectedAsset.stock}
                                    className="w-6 h-6 rounded"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="text-left">
                                  <div className="font-semibold">{selectedAsset.stock}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-[180px]">
                                    {selectedAsset.name}
                                  </div>
                                </div>
                              </div>
                              {selectedAsset.close && (
                                <div className="text-right">
                                  <div className="font-medium">{formatPrice(selectedAsset.close)}</div>
                                  {selectedAsset.change && (
                                    <div className={cn(
                                      "text-sm",
                                      selectedAsset.change >= 0 ? "text-green-600" : "text-red-600"
                                    )}>
                                      {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Search className="w-4 h-4" />
                              Buscar {assetType === 'STOCK' ? 'ação' : 'FII'}...
                            </div>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder={`Buscar ${assetType === 'STOCK' ? 'ações' : 'FIIs'}...`}
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {loading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Buscando no cache local...
                              </div>
                            ) : searchQuery.length < 2 ? (
                              'Digite pelo menos 2 caracteres para buscar.'
                            ) : (
                              'Nenhum ativo encontrado.'
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {assets.map((asset) => (
                              <CommandItem
                                key={asset.stock}
                                value={asset.stock}
                                onSelect={() => handleAssetSelect(asset)}
                                className="flex items-center justify-between p-3 cursor-pointer min-h-[60px]"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  {asset.logo && (
                                    <img 
                                      src={asset.logo} 
                                      alt={asset.stock}
                                      className="w-8 h-8 rounded"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{asset.stock}</span>
                                      {asset.sector && (
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                          {asset.sector}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                      {asset.name}
                                    </div>
                                    {asset.volume && (
                                      <div className="text-xs text-gray-400">
                                        Vol: {formatVolume(asset.volume)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right ml-2 shrink-0">
                                  {asset.close && (
                                    <>
                                      <div className="font-medium">
                                        {formatPrice(asset.close)}
                                      </div>
                                      {asset.change && (
                                        <div className={cn(
                                          "text-sm",
                                          asset.change >= 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                                
                                <Check
                                  className={cn(
                                    "ml-2 h-4 w-4 shrink-0",
                                    selectedAsset?.stock === asset.stock ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
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
                      <Input 
                        type="text"
                        placeholder="0,00"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedAsset && selectedAsset.close && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Preço atual: {formatPrice(selectedAsset.close)}
                    </p>
                    {selectedAsset.change && (
                      <p className={cn(
                        "text-sm",
                        selectedAsset.change >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {selectedAsset.change >= 0 ? '+' : ''}{selectedAsset.change.toFixed(2)}% hoje
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('averagePrice', formatPriceInput(selectedAsset.close!))}
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                  >
                    Usar preço atual
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 w-full"
                disabled={!form.watch('ticker') || !form.watch('quantity') || !form.watch('averagePrice')}
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