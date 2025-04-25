import { SelectedItem } from '@/components/screens/MenuScreen';

interface ProcessedOption {
  id: string;
  name: string;
  extra_price: number;
}

interface ProcessedModifier {
  name: string;
  options: ProcessedOption[];
}

export const handleModifierSubmit = (
  selectedItem: SelectedItem,
  selectedOptions: Record<string, string[]>,
  onAddToCart: (id: string, modifiers: Record<string, ProcessedModifier>) => void,
  reset: () => void
) => {
  const processedModifiers: Record<string, ProcessedModifier> = {};

  Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
    const modifier = selectedItem.modifiers.find(m => m.id === modifierId);
    if (modifier) {
      const options = optionIds.map(optionId => {
        const option = modifier.options.find(o => o.id === optionId);
        if (!option) return null;
        return { 
          id: optionId, 
          name: option.name, 
          extra_price: option.extra_price 
        } as ProcessedOption;
      }).filter(Boolean) as ProcessedOption[];

      if (options.length > 0) {
        processedModifiers[modifierId] = { 
          name: modifier.name, 
          options 
        };
      }
    }
  });

  console.log('[useModifierSubmit] Processed modifiers:', processedModifiers);
  onAddToCart(selectedItem.id, processedModifiers);
  reset();
}; 