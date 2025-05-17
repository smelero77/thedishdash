export interface Recommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  image_url: string;
  category_info: Array<{
    id: string;
    name: string;
  }>;
} 