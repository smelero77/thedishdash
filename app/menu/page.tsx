import { Suspense } from 'react';
import { MenuScreenWrapper } from '@/components/screens/MenuScreenWrapper';
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen';
import { getSlots, getCategoriesWithSlots, getMenuItems } from '@/lib/data';
import { processMenuItem } from '@/utils/menu';
import { getCurrentSlot } from '@/utils/slot';
import type { Slot, Category, SupabaseMenuItem, MenuItemData, CategoryWithItems } from '@/types/menu';

// Asume que getCategoriesWithSlots devuelve este tipo de objeto por cada relación
interface SlotCategoryRelation {
    slot_id: string;
    category_id: string;
    sort_order?: number;
    slots: Slot;
    categories: Category;
}

export default async function MenuPage() {
    console.log("[MenuPage] Server Component: Iniciando carga de datos...");

    // 1. Cargar Datos Crudos en Paralelo
    let slots: Slot[] = [];
    let slotCategoryRelations: SlotCategoryRelation[] = [];
    let rawMenuItems: SupabaseMenuItem[] = [];

    try {
        [slots, slotCategoryRelations, rawMenuItems] = await Promise.all([
            getSlots().catch(err => {
                console.error("[MenuPage] Error cargando slots:", err);
                return [];
            }),
            getCategoriesWithSlots().catch(err => {
                console.error("[MenuPage] Error cargando categorías:", err);
                return [];
            }),
            getMenuItems().catch(err => {
                console.error("[MenuPage] Error cargando items:", err);
                return [];
            })
        ]);
        console.log(`[MenuPage] Datos crudos cargados: ${slots.length} slots, ${slotCategoryRelations.length} relaciones, ${rawMenuItems.length} items.`);
    } catch (error) {
        console.error("[MenuPage] Error cargando datos iniciales:", error);
        // Por ahora, continuamos con arrays vacíos
    }

    // 2. Encontrar el Slot Actual usando la nueva utilidad
    const currentSlot = getCurrentSlot(slots);
    console.log(`[MenuPage] Slot actual determinado: ${currentSlot ? currentSlot.name : 'Ninguno'}`);

    // 3. Procesar Menu Items
    const processedMenuItems: MenuItemData[] = rawMenuItems.map(processMenuItem);
    console.log(`[MenuPage] Menu items procesados: ${processedMenuItems.length}`);

    // 4. Ordenar Categorías según el Slot Actual
    let orderedCategories: Category[] = [];
    if (currentSlot && slotCategoryRelations.length > 0) {
        // Filtrar relaciones para el slot actual
        const relationsForCurrentSlot = slotCategoryRelations.filter(
            relation => relation.slot_id === currentSlot.id && relation.categories
        );

        // Ordenar por el campo 'sort_order' de la tabla de relación
        relationsForCurrentSlot.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

        // Extraer los datos de la categoría en el orden correcto
        orderedCategories = relationsForCurrentSlot.map(relation => relation.categories);

        console.log(`[MenuPage] Categorías ordenadas para '${currentSlot.name}': ${orderedCategories.map(c => c.name).join(', ')} (${orderedCategories.length} categorías)`);
    } else {
        // Lógica de fallback si no hay slot activo o no hay relaciones
        if (!currentSlot) console.warn("[MenuPage] No hay slot activo.");
        if (slotCategoryRelations.length === 0) console.warn("[MenuPage] No se encontraron relaciones slot-categoría.");

        // Fallback: Mostrar todas las categorías únicas con su orden por defecto
        const allCategoriesMap = new Map<string, Category>();
        slotCategoryRelations.forEach(relation => {
            if (relation.categories) {
                allCategoriesMap.set(relation.categories.id, relation.categories);
            }
        });
        orderedCategories = Array.from(allCategoriesMap.values())
            .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
        console.warn(`[MenuPage] Usando orden de categorías por defecto (${orderedCategories.length} categorías).`);
    }

    // 5. Combinar Categorías Ordenadas con sus Items
    const categoriesWithItems: CategoryWithItems[] = orderedCategories.map(category => ({
        ...category,
        items: processedMenuItems.filter(item =>
            (item.category_ids || []).includes(category.id)
        )
    }));
    console.log(`[MenuPage] Estructura final 'categoriesWithItems' creada.`);

    // 6. Pasar Datos Procesados y Ordenados al Componente Cliente MenuScreen
    return (
        <Suspense fallback={<LoadingScreen />}>
            <MenuScreenWrapper
                initialSlots={slots}
                initialCategories={categoriesWithItems}
                initialMenuItems={processedMenuItems}
                initialCurrentSlot={currentSlot}
            />
        </Suspense>
    );
} 