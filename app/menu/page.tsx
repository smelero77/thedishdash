import { Suspense } from 'react';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
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

  try {
    [slots, slotCategoryRelations, rawMenuItems] = await Promise.all([
      getSlots(),
      getCategoriesWithSlots(),
      getMenuItems(),
    ]);
  } catch (error) {
    console.error('[MenuPage] Error cargando datos:', error);
    return <div>Error cargando el menú...</div>;
  }

  // 2. Encontrar el Slot Actual
  const currentSlot = getCurrentSlot(slots);

  // 3. Procesar Menu Items
  const processedMenuItems: MenuItemData[] = rawMenuItems.map(processMenuItem);

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

  // 5. Combinar Categorías con sus Items
  const categoriesWithItems: CategoryWithItems[] = orderedCategories.map((category) => ({
    ...category,
    items: processedMenuItems.filter((item) => (item.category_ids || []).includes(category.id)),
  }));

  if (!categoriesWithItems.length || !processedMenuItems.length) {
    return <div>Cargando menú...</div>;
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
