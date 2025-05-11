interface Recommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  image_url?: string;
}

interface RecommendationsProps {
  recommendations: Recommendation[];
  onViewDetails: (productId: string) => void;
}

export function Recommendations({ recommendations, onViewDetails }: RecommendationsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Recomendaciones</h3>
      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <div 
            key={rec.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {rec.image_url && (
                <img 
                  src={rec.image_url} 
                  alt={rec.name}
                  className="w-24 h-24 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">{rec.name}</h4>
                <p className="text-gray-600 mt-1">{rec.reason}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    {rec.price.toFixed(2)} €
                  </span>
                  <button
                    onClick={() => onViewDetails(rec.id)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 