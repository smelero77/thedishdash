import type { Modifier } from '@/types/modifiers';
import type { SelectedItem } from '@/components/screens/MenuScreen';

interface ProcessedOption {
  id: string;
  name: string;
  extra_price: number;
}

// Type guard para ProcessedOption
function isProcessedOption(o: ProcessedOption | null): o is ProcessedOption {
  return o !== null;
}

export function handleModifierSubmit(
  selectedItem: SelectedItem,
  selectedOptions: Record<string, string[]>,
  modifiers: Modifier[],
  onAddToCart: (id: string, mods: any) => void,
  reset: () => void,
) {
  // Verificar que tenemos los datos necesarios
  if (!selectedItem || !selectedOptions || !modifiers) {
    console.error('Datos incompletos para procesar modificadores');
    return;
  }

  // Log para debug
  console.log('IDs de modificadores recibidos:', Object.keys(selectedOptions));

  const processedModifiers: Record<
    string,
    {
      name: string;
      options: ProcessedOption[];
    }
  > = {};

  // Procesar cada modificador seleccionado
  Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
    // Buscar el modificador
    const modifier = modifiers.find((m) => m.id === modifierId);
    if (!modifier) {
      console.warn(`Modifier con id ${modifierId} no encontrado`);
      return; // saltar este modificador
    }

    // Procesar las opciones seleccionadas
    const options = optionIds
      .map((optionId): ProcessedOption | null => {
        const opt = modifier.options.find(
          (o: { id: string; name: string; extra_price: number }) => o.id === optionId,
        );
        if (!opt) return null;
        return { id: opt.id, name: opt.name, extra_price: opt.extra_price };
      })
      .filter(isProcessedOption);

    // Solo añadir si hay opciones válidas
    if (options.length > 0) {
      processedModifiers[modifierId] = {
        name: modifier.name,
        options,
      };
    }
  });

  // Añadir al carrito si hay modificadores procesados
  if (Object.keys(processedModifiers).length > 0) {
    onAddToCart(selectedItem.id, processedModifiers);
  }

  // Resetear el formulario
  reset();
}
