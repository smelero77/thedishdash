import React from 'react';
import { MenuItem } from '@/lib/types/menu';
import { useItemClick } from '@/hooks/useItemClick';
import { formatPrice } from '@/lib/utils/format';
import { MenuCombo } from '@/lib/chat/types';
import { RecommendationCard } from './RecommendationCard';

interface MenuComboCardProps {
  combo: MenuCombo;
  onViewDetails?: (productId: string) => void;
}

export function MenuComboCard({ combo, onViewDetails }: MenuComboCardProps) {
  const { handleItemClick } = useItemClick();

  const handleAddAll = () => {
    for (const item of combo.items) {
      handleItemClick(item);
    }
  };

  return (
    <div className="bg-white/10 rounded-xl p-4">
      <div className="mb-4">
        <h3 className="text-white font-medium text-lg">{combo.title}</h3>
        {combo.description && (
          <p className="text-white/70 text-sm mt-1">{combo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[#1ce3cf] font-medium">
            {combo.totalPrice.toFixed(2)}€
          </span>
          {combo.dietaryTags.map(tag => (
            <span 
              key={tag}
              className="text-xs bg-white/20 text-white px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {combo.isSeasonal && (
            <span className="text-xs bg-[#1ce3cf]/20 text-[#1ce3cf] px-2 py-1 rounded-full">
              Estacional
            </span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {combo.items.map(item => (
          <RecommendationCard 
            key={item.id} 
            item={item} 
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
      <button
        className="mt-2 w-full bg-[#1ce3cf] text-black font-medium py-2 px-4 rounded hover:bg-[#1ce3cf]/90 transition-colors"
        onClick={handleAddAll}
      >
        Añadir todo al carrito
      </button>
    </div>
  );
} 