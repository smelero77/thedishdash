interface StoryBubbleProps {
  alias: string;
  itemCount: number;
  onSelect: () => void;
}

export const StoryBubble = ({ alias, itemCount, onSelect }: StoryBubbleProps) => (
  <div 
    className="flex-shrink-0 flex flex-col items-center cursor-pointer"
    onClick={onSelect}
  >
    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-1.5 sm:mb-2">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
        <div className="w-full h-full rounded-full bg-white p-[2px]">
          <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
            <span className="text-[#4f968f] text-base sm:text-lg font-semibold">
              {alias.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-[#4f968f] flex items-center justify-center">
        <span className="text-[#4f968f] text-[10px] sm:text-xs font-medium">{itemCount}</span>
      </div>
    </div>
    <span className="text-[#0e1b19] text-[10px] sm:text-xs font-medium truncate max-w-[56px] sm:max-w-[64px]">
      {alias}
    </span>
  </div>
); 