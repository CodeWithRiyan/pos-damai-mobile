import { Product } from '@/hooks/use-product';

export interface BaseCartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface ConfirmData {
  reason: string;
  returnType: string;
}
