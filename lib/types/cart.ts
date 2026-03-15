import { Product } from "@/lib/api/products";

export interface BaseCartItem {
  product: Product;
  quantity: number;
  note?: string;
}

export interface ConfirmData {
  reason: string;
  returnType: string;
}
