import { Suspense } from 'react';
import MenuScreen from '@/components/screens/MenuScreen';
import LoadingScreen from '@/components/screens/MenuScreen/LoadingScreen';
import { getSlots, getCategoriesWithSlots, getMenuItems } from '@/lib/data';

export default async function MenuPage() {
  // Cargar datos en el servidor
  const slots = await getSlots();
  const categories = await getCategoriesWithSlots();
  const menuItems = await getMenuItems();

  // Encontrar el slot actual
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const currentSlot = slots.find(slot => {
    const [startHour, startMinute] = slot.start_time.split(':').map(Number);
    const [endHour, endMinute] = slot.end_time.split(':').map(Number);
    const slotStart = startHour * 60 + startMinute;
    const slotEnd = endHour * 60 + endMinute;
    return currentTime >= slotStart && currentTime < slotEnd;
  });

  return (
    <Suspense fallback={<LoadingScreen />}>
      <MenuScreen 
        initialSlots={slots}
        initialCategories={categories}
        initialMenuItems={menuItems}
        initialCurrentSlot={currentSlot || null}
      />
    </Suspense>
  );
} 