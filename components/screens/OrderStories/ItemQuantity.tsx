interface ItemQuantityProps {
  quantity: number;
  className?: string;
}

export const ItemQuantity = ({ quantity, className = '' }: ItemQuantityProps) => {
  return (
    <div
      className={`flex items-center justify-center w-10 h-10 border border-[#d0e6e4] rounded-full bg-[#4f968f]/10 text-[#0e1b19] font-medium text-base ${className}`}
    >
      {quantity}
    </div>
  );
};
