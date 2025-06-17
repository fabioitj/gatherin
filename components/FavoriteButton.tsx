'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  newsId: string;
  initialIsFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({ 
  newsId, 
  initialIsFavorited = false,
  size = 'md',
  variant = 'ghost',
  className,
  showText = false
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      toast.error('Você precisa estar logado para favoritar notícias');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newsId }),
      });

      if (!response.ok) {
        throw new Error('Falha ao alterar favorito');
      }

      const data = await response.json();
      setIsFavorited(data.isFavorited);
      
      toast.success(data.message, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erro ao alterar favorito');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(
        sizeClasses[size],
        'transition-all duration-200 hover:scale-110',
        isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500',
        className
      )}
      title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isFavorited ? 'fill-current' : ''
        )} 
      />
      {showText && (
        <span className="ml-2 text-sm">
          {isFavorited ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </Button>
  );
}