import { MenuItem } from '../../types/menu';

export interface Recommendation {
  id: string;
  name: string;
  price: number;
  reason: string;
  image_url: string;
}

export interface ProductDetails {
  item: MenuItem;
  explanation: string;
}

export type AssistantResponse = 
  | { type: "assistant_text"; content: string }
  | { type: "recommendations"; data: Recommendation[] }
  | { type: "product_details"; data: ProductDetails }; 