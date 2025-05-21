import { useState, useMemo } from 'react';
import { StoryBubble } from './OrderStories/StoryBubble';
import { StoryModal } from './OrderStories/StoryModal';
import { CartItem } from '@/types/menu';

interface OrderStoriesProps {
  groupedItems: Record<string, { items: CartItem[]; total: number; itemCount: number }>;
  currentClientAlias?: string;
}

export const OrderStories = ({ groupedItems, currentClientAlias }: OrderStoriesProps) => {
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const handleStorySelect = (alias: string) => {
    setSelectedAlias(alias);
    setCurrentItemIndex(0);
  };

  // Recalcular el total de items por alias cada vez que cambian los items
  const updatedGroupedItems = useMemo(() => {
    return Object.entries(groupedItems).reduce(
      (acc, [alias, { items, total }]) => {
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
        acc[alias] = { items, total, itemCount };
        return acc;
      },
      {} as Record<string, { items: CartItem[]; total: number; itemCount: number }>,
    );
  }, [groupedItems]);

  // Ordenar los items para que el alias actual aparezca primero
  const sortedEntries = useMemo(() => {
    return Object.entries(updatedGroupedItems).sort(([aliasA], [aliasB]) => {
      if (aliasA === currentClientAlias) return -1;
      if (aliasB === currentClientAlias) return 1;
      return aliasA.localeCompare(aliasB);
    });
  }, [updatedGroupedItems, currentClientAlias]);

  return (
    <div className="relative h-28 sm:h-32">
      <div className="absolute inset-0 allow-horizontal-scroll no-scrollbar">
        <div className="flex gap-2 sm:gap-3 px-2 sm:px-4 min-w-full">
          {sortedEntries.map(([alias, { items, itemCount }]) => (
            <StoryBubble
              key={alias}
              alias={alias}
              itemCount={itemCount}
              onSelect={() => handleStorySelect(alias)}
            />
          ))}
        </div>
      </div>
      {/* Scroll indicator gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-8 pointer-events-none bg-gradient-to-l from-white dark:from-[#0f1b1a] to-transparent" />
      <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 pointer-events-none bg-gradient-to-r from-white dark:from-[#0f1b1a] to-transparent" />

      {selectedAlias && (
        <StoryModal
          alias={selectedAlias}
          items={updatedGroupedItems[selectedAlias].items}
          currentIndex={currentItemIndex}
          onClose={() => setSelectedAlias(null)}
        />
      )}
    </div>
  );
};
