'use client';

import { useState, useEffect } from 'react';
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
  onToggle?: (isFavorited: boolean) => void;
}

export function FavoriteButton({ 
  newsId, 
  initialIsFavorited = false,
  size = 'md',
  variant = 'ghost',
  className,
  showText = false,
  onToggle
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when prop changes
  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited]);

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
      
      // Call the onToggle callback if provided
      if (onToggle) {
        onToggle(data.isFavorited);
      }
      
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
    sm: showText ? 'h-8 px-3' : 'h-8 w-8',
    md: showText ? 'h-9 px-4' : 'h-9 w-9',
    lg: showText ? 'h-10 px-5' : 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <Button
      variant={variant}
      size={showText ? 'default' : 'icon'}
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
          isFavorited ? 'fill-current' : '',
          showText ? 'mr-2' : ''
        )} 
      />
      {showText && (
        <span className="text-sm">
          {isFavorited ? 'Favoritado' : 'Favoritar'}
        </span>
      )}
    </Button>
  );
}