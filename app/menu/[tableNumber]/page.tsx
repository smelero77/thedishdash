import useCart from '@/hooks/useCart';
import { MenuItemData } from '@/types/menu';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTable } from '@/context/TableContext';

interface MenuPageProps {
  params: {
    tableNumber: string;
  };
}

export default function MenuPage({ params }: MenuPageProps) {
  const { tableNumber: urlTableNumber } = params;
  const { tableNumber } = useTable();
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Verificar que el número de mesa del contexto coincida con el de la URL
  useEffect(() => {
    if (tableNumber !== parseInt(urlTableNumber, 10)) {
      toast.error('Número de mesa no válido');
      router.push('/');
      return;
    }
  }, [tableNumber, urlTableNumber, router]);

  // Obtener los datos del menú
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const { data, error } = await supabase.from('menu_items').select('*').order('category');

        if (error) {
          toast.error('Error al cargar el menú');
          return;
        }

        setMenuItems(data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const { cart, cartTotal, handleAddToCart, handleRemoveFromCartByItem } = useCart(
    menuItems,
    'guest',
    tableNumber,
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Menu for Table {tableNumber}</h1>
      {/* Rest of the component */}
    </div>
  );
}
