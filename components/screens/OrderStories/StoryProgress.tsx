interface StoryProgressProps {
  currentIndex: number;
  totalItems: number;
}

export const StoryProgress = ({ currentIndex, totalItems }: StoryProgressProps) => (
  <div className="absolute top-0 left-0 right-0 h-1 bg-[#d0e6e4]">
    <div 
      className="h-full bg-[#4f968f] transition-all duration-300"
      style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
    />
  </div>
); 