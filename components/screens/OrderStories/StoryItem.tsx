import Image from 'next/image';
import { CartItem } from '@/types/menu';
import { ItemQuantity } from './ItemQuantity';
import { formatPrice } from '@/utils/format';

interface StoryItemProps {
  item: CartItem;
}

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
        <div className="flex items-center justify-between">
          <h3 className="text-[#0e1b19] font-medium">{item.item.name}</h3>
          <ItemQuantity quantity={item.quantity} />
        </div>
        {Object.entries(item.modifiers || {}).map(([modifierId, modifier]) => (
          <div key={modifierId} className="mt-1">
            {modifier.options.map(opt => (
              <p key={opt.id} className="text-sm text-[#4f968f]">
                {opt.extra_price > 0 
                  ? `+${opt.name} (+${opt.extra_price.toFixed(2)}€)`
                  : `• ${opt.name}`}
              </p>
            ))}
          </div>
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