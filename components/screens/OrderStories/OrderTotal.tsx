import { CartItem } from '@/types/menu';

interface OrderTotalProps {
  items: CartItem[];
  visibleItems: CartItem[];
  className?: string;
}

export const OrderTotal = ({ items, visibleItems, className = '' }: OrderTotalProps) => {
  const total = visibleItems.reduce((sum, item) => {
    const itemTotal = item.item.price * item.quantity;
    const modifiersTotal = Object.values(item.modifiers || {}).reduce((modSum, modifier) => 
      modSum + modifier.options.reduce((optSum, opt) => optSum + (opt.extra_price || 0), 0), 0
    ) * item.quantity;
    return sum + itemTotal + modifiersTotal;
  }, 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#4f968f]/10 to-[#1ce3cf]/10 rounded-full">
        <span className="text-[#4f968f] text-lg font-bold">€</span>
        <span className="text-[#0e1b19] text-lg font-bold">
          {total.toFixed(2).replace('.', ',')}
        </span>
      </div>
    </div>
  );
}; 