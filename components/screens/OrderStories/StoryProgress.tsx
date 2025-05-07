interface StoryProgressProps {
  totalItems: number;
  currentIndex: number;
}

export const StoryProgress = ({ totalItems, currentIndex }: StoryProgressProps) => {
  const progress = Math.min(((currentIndex + 1) / totalItems) * 100, 100);

  return (
    <div className="w-full h-1 bg-[#d0e6e4]/20">
      <div 
        className="h-full bg-[#4f968f] transition-all duration-300 ease-out"
        style={{ 
          width: `${progress}%`,
          transform: 'translateZ(0)',
          willChange: 'width'
        }}
      />
    </div>
  );
}; 