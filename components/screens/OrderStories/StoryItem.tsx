import Image from 'next/image';
import { CartItem } from '@/types/menu';

interface StoryItemProps {
  item: CartItem;
}

const formatPrice = (price: number): string => price.toFixed(2).replace('.', ',') + ' €';

export const StoryItem = ({ item }: StoryItemProps) => (
  <div className="p-4">
    <div className="flex items-start gap-4">
      {item.item.image_url && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden">
          <Image
            src={item.item.image_url}
            alt={item.item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-[#0e1b19] font-medium">{item.item.name}</h3>
        {Object.entries(item.modifiers || {}).map(([modifierId, modifier]) => (
          <p key={modifierId} className="text-sm text-[#4f968f]">
            {modifier.options.map(opt => 
              opt.extra_price > 0 
                ? `+${opt.name} (+${opt.extra_price.toFixed(2)}€)`
                : `• ${opt.name}`
            ).join(', ')}
          </p>
        ))}
        <p className="text-[#4f968f] text-sm mt-1">
          {formatPrice(
            item.item.price + 
            Object.values(item.modifiers || {}).reduce((total, modifier) => 
              total + modifier.options.reduce((optTotal, opt) => optTotal + opt.extra_price, 0)
            , 0)
          )} c/u
        </p>
      </div>
    </div>
  </div>
); 