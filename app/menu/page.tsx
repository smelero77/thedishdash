import { Suspense } from 'react';
import { MenuScreenWrapper } from '@/components/screens/MenuScreenWrapper';
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen';
import { getSlots, getCategoriesWithSlots, getMenuItems } from '@/lib/data';
import { processMenuItem, CategoryWithItems, getCurrentSlot } from '@/lib/utils';
import type { Slot, Category, SupabaseMenuItem, MenuItemData } from '@/types/menu';

// Asume que getCategoriesWithSlots devuelve este tipo de objeto por cada relación
interface SlotCategoryRelation {
    slot_id: string;
    category_id: string;
    sort_order?: number;
    slots: Slot;
    categories: Category;
}

export default async function MenuPage({ searchParams }: { searchParams: { userMessage?: string } }) {
    // Esperar a que searchParams esté disponible
    const params = await Promise.resolve(searchParams);
    const userMessage = params?.userMessage || "";
    console.log("[MenuPage] userMessage:", userMessage);

    console.log("[MenuPage] Server Component: Iniciando carga de datos...");

    // 1. Cargar slots primero para poder detectar intención
    let slots: Slot[] = [];
    try {
        slots = await getSlots();
    } catch (error) {
        console.error("[MenuPage] Error cargando slots:", error);
        slots = [];
    }

    // 2. Detectar slot por intención en la query ANTES de cargar el resto
    function getSlotFromIntent(userMessage: string, slots: Slot[]): Slot | null {
        const q = userMessage.toLowerCase();
        if (q.includes('desayun')) return slots.find(s => s.name.toLowerCase().includes('desayun')) || null;
        if (q.includes('comid')) return slots.find(s => s.name.toLowerCase().includes('comid')) || null;
        if (q.includes('cen')) return slots.find(s => s.name.toLowerCase().includes('cen')) || null;
        if (q.includes('meriendan') || q.includes('merienda')) return slots.find(s => s.name.toLowerCase().includes('meriendan') || s.name.toLowerCase().includes('merienda')) || null;
        return null;
    }
    const intentSlot = getSlotFromIntent(userMessage, slots);
    const slotToUse = intentSlot ?? getCurrentSlot(slots);
    console.log(`[MenuPage] Slot final determinado: ${slotToUse ? slotToUse.name : 'Ninguno'}`);

    // 3. Cargar relaciones y items SOLO para el slot seleccionado
    let slotCategoryRelations: SlotCategoryRelation[] = [];
    let rawMenuItems: SupabaseMenuItem[] = [];
    try {
        // Cargar todas las relaciones y items, pero filtrar después por slotToUse
        [slotCategoryRelations, rawMenuItems] = await Promise.all([
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
    }

    // 4. Filtrar relaciones y categorías por el slot seleccionado
    let orderedCategories: Category[] = [];
    if (slotToUse && slotCategoryRelations.length > 0) {
        const relationsForSlot = slotCategoryRelations.filter(
            relation => relation.slot_id === slotToUse.id && relation.categories
        );
        relationsForSlot.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
        orderedCategories = relationsForSlot.map(relation => relation.categories);
        console.log(`[MenuPage] Categorías ordenadas para '${slotToUse.name}': ${orderedCategories.map(c => c.name).join(', ')} (${orderedCategories.length} categorías)`);
    } else {
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

    // 5. Procesar Menu Items y filtrar solo los del slot/categoría seleccionados
    const processedMenuItems: MenuItemData[] = rawMenuItems.map(processMenuItem);
    // Opcional: podrías filtrar aquí los items por slot/categoría si lo necesitas

    // 6. Combinar Categorías Ordenadas con sus Items
    const categoriesWithItems: CategoryWithItems[] = orderedCategories.map(category => ({
        ...category,
        items: processedMenuItems.filter(item =>
            (item.category_ids || []).includes(category.id)
        ),
        category: category
    }));
    console.log(`[MenuPage] Estructura final 'categoriesWithItems' creada.`);

    // 7. Pasar Datos Procesados y Ordenados al Componente Cliente MenuScreen
    return (
        <Suspense fallback={<LoadingScreen />}> 
            <MenuScreenWrapper
                initialSlots={slots}
                initialCategories={categoriesWithItems}
                initialMenuItems={processedMenuItems}
                initialCurrentSlot={slotToUse}
                mainCategoryId={orderedCategories.length > 0 ? orderedCategories[0].id : null}
            />
        </Suspense>
    );
} 