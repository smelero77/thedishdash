import { MenuItem } from '@/lib/types/menu';

interface ProductDetailProps {
  item: MenuItem;
  explanation: string;
}

export function ProductDetail({ item, explanation }: ProductDetailProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          {item.image_url && (
            <img 
              src={item.image_url} 
              alt={item.name}
              className="w-32 h-32 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
            <p className="text-xl font-semibold text-gray-900 mt-2">
              {item.price.toFixed(2)} €
            </p>
            {item.description && (
              <p className="text-gray-600 mt-2">{item.description}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Detalles</h4>
          <div className="prose prose-sm text-gray-600">
            {explanation}
          </div>
        </div>

        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Ingredientes</h4>
            <ul className="list-disc list-inside text-gray-600">
              {item.ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        )}

        {item.allergens && item.allergens.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Alérgenos</h4>
            <p className="text-gray-600">
              {item.allergens.join(', ')}
            </p>
          </div>
        )}

        {item.chef_notes && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Notas del Chef</h4>
            <p className="text-gray-600 italic">{item.chef_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
} 