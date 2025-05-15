import React from 'react';
import { MenuItem } from '@/lib/types/menu';
import { Plus } from 'lucide-react';

interface RecommendationCardProps {
  item: MenuItem & {
    reason?: string;
  };
  onViewDetails?: (productId: string) => void;
  onAddToCart?: (itemId: string, modifiers?: any) => void;
}

export function RecommendationCard({ item, onViewDetails, onAddToCart }: RecommendationCardProps) {
  return (
    <div className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors">
      <div className="flex items-start gap-4">
        {item.image_url && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-medium text-lg leading-tight">{item.name}</h3>
            <span className="text-[#1ce3cf] font-medium text-lg">
              {item.price.toFixed(2)}€
            </span>
          </div>
          
          {item.reason && (
            <p className="text-white/70 text-sm mt-1">{item.reason}</p>
          )}
          
          {item.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">{item.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {item.diet_tags?.map(tag => (
              <span 
                key={tag.id}
                className="text-xs bg-[#1ce3cf]/20 text-[#1ce3cf] px-2 py-1 rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => onViewDetails?.(item.id)}
              className="text-white/70 text-sm hover:text-white transition-colors"
            >
              Ver detalles
            </button>
            <button
              onClick={() => onAddToCart?.(item.id)}
              className="flex items-center gap-1 bg-[#1ce3cf] text-[#0e1b19] px-3 py-1.5 rounded-full hover:bg-[#1ce3cf]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Añadir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 