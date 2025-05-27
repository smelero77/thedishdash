import { Suspense } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getSlots, getCategoriesWithSlots, getMenuItems } from '@/lib/data';
import { processMenuItem } from '@/utils/menu';
import { getCurrentSlot } from '@/utils/slot';
import MenuScreen from '@/components/screens/MenuScreen';
import type {
  Slot,
  Category,
  SupabaseMenuItem,
  MenuItemData,
  CategoryWithItems,
} from '@/types/menu';

// Asume que getCategoriesWithSlots devuelve este tipo de objeto por cada relación
interface SlotCategoryRelation {
  slot_id: string;
  category_id: string;
  sort_order?: number;
  slots: Slot;
  categories: Category;
}

export default async function MenuPage() {
  // 1. Cargar Datos Crudos en Paralelo
  let slots: Slot[] = [];
  let slotCategoryRelations: SlotCategoryRelation[] = [];
  let rawMenuItems: SupabaseMenuItem[] = [];
  let error: Error | null = null;

  try {
    console.log('[MenuPage] Iniciando carga de datos...');

    const results = await Promise.allSettled([
      getSlots(),
      getCategoriesWithSlots(),
      getMenuItems(),
    ]);

    console.log('[MenuPage] Resultados de Promise.allSettled:', JSON.stringify(results, null, 2));

    // Comprobar cada resultado
    if (results[0].status === 'rejected') {
      console.error('[MenuPage] Error en getSlots:', results[0].reason);
    }
    if (results[1].status === 'rejected') {
      console.error('[MenuPage] Error en getCategoriesWithSlots:', results[1].reason);
    }
    if (results[2].status === 'rejected') {
      console.error('[MenuPage] Error en getMenuItems:', results[2].reason);
    }

    // Asignar solo si se cumplieron
    slots = results[0].status === 'fulfilled' ? results[0].value : [];
    slotCategoryRelations = results[1].status === 'fulfilled' ? results[1].value : [];
    rawMenuItems = results[2].status === 'fulfilled' ? results[2].value : [];

    console.log('[MenuPage] Datos cargados:', {
      slots: slots.length,
      slotCategoryRelations: slotCategoryRelations.length,
      rawMenuItems: rawMenuItems.length,
    });

    // Verificar si algún resultado está vacío
    if (!slots.length || !slotCategoryRelations.length || !rawMenuItems.length) {
      error = new Error('No se pudieron cargar todos los datos necesarios');
      console.error('[MenuPage] Error: Datos incompletos', {
        slots: slots.length,
        slotCategoryRelations: slotCategoryRelations.length,
        rawMenuItems: rawMenuItems.length,
      });
    }
  } catch (e) {
    console.error('[MenuPage] Error cargando datos:', e);
    error = e instanceof Error ? e : new Error('Error desconocido al cargar datos');
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error al cargar el menú</h2>
        <p className="text-gray-600 dark:text-gray-400">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#1ce3cf] text-white rounded-lg hover:bg-[#1ce3cf]/90 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // 2. Encontrar el Slot Actual
  const currentSlot = getCurrentSlot(slots);
  console.log('[MenuPage] Slot actual:', currentSlot?.id);

  // 3. Procesar Menu Items
  const processedMenuItems: MenuItemData[] = rawMenuItems.map(processMenuItem);
  console.log('[MenuPage] Items procesados:', processedMenuItems.length);

  // 4. Ordenar Categorías según el Slot Actual
  let orderedCategories: Category[] = [];
  if (currentSlot && slotCategoryRelations.length > 0) {
    const relationsForCurrentSlot = slotCategoryRelations.filter(
      (relation) => relation.slot_id === currentSlot.id && relation.categories,
    );
    relationsForCurrentSlot.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    orderedCategories = relationsForCurrentSlot.map((relation) => relation.categories);
  } else {
    const allCategoriesMap = new Map<string, Category>();
    slotCategoryRelations.forEach((relation) => {
      if (relation.categories) {
        allCategoriesMap.set(relation.categories.id, relation.categories);
      }
    });
    orderedCategories = Array.from(allCategoriesMap.values()).sort(
      (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999),
    );
  }
  console.log('[MenuPage] Categorías ordenadas:', orderedCategories.length);

  // 5. Combinar Categorías con sus Items
  const categoriesWithItems: CategoryWithItems[] = orderedCategories.map((category) => ({
    ...category,
    items: processedMenuItems.filter((item) => (item.category_ids || []).includes(category.id)),
  }));
  console.log('[MenuPage] Categorías con items:', categoriesWithItems.length);

  // Verificar si hay datos para mostrar
  if (!categoriesWithItems.length || !processedMenuItems.length) {
    console.warn('[MenuPage] No hay datos para mostrar');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
          No hay elementos disponibles en el menú
        </h2>
        <p className="text-gray-500 dark:text-gray-500">
          Por favor, intenta más tarde o contacta al servicio de atención al cliente.
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <MenuScreen
        initialSlots={slots}
        initialCategories={orderedCategories}
        initialMenuItems={processedMenuItems}
        initialCurrentSlot={currentSlot}
      />
    </Suspense>
  );
}
