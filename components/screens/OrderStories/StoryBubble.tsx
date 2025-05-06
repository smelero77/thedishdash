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
    <div className="relative w-16 h-16 mb-2">
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#4f968f] to-[#1ce3cf] p-[2px]">
        <div className="w-full h-full rounded-full bg-white p-[2px]">
          <div className="w-full h-full rounded-full bg-[#f8fbfb] flex items-center justify-center">
            <span className="text-[#4f968f] text-lg font-semibold">
              {alias.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-[#4f968f] flex items-center justify-center">
        <span className="text-[#4f968f] text-xs font-medium">{itemCount}</span>
      </div>
    </div>
    <span className="text-[#0e1b19] text-sm font-medium truncate max-w-[64px]">
      {alias}
    </span>
  </div>
); 