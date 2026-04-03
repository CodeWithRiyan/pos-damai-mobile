import { Product, ProductVariant } from '@/hooks/use-product';
import { create } from 'zustand';

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  physicalStock: number;
}

interface StockOpnameState {
  addProduct: Product | null;
  addProductVariantId: string | null;
  openConfirm: boolean;
  cart: CartItem[];
  setAddProduct: (state: Product | null, variantId?: string) => void;
  setOpenConfirm: (state: boolean) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string, variantId?: string) => void;
  resetCart: () => void;
}

export const useStockOpnameStore = create<StockOpnameState>((set) => ({
  addProduct: null,
  addProductVariantId: null,
  openConfirm: false,
  cart: [],
  setAddProduct: (state, variantId) =>
    set({ addProduct: state, addProductVariantId: variantId || null }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart?.findIndex(
        (cartItem) =>
          cartItem.product.id === item.product.id && cartItem.variant?.id === item.variant?.id,
      );

      let updatedCart: CartItem[];

      if (existingItemIndex !== undefined && existingItemIndex !== -1 && state.cart) {
        updatedCart = [...state.cart];
        updatedCart[existingItemIndex] = item;
      } else {
        updatedCart = state.cart ? [...state.cart, item] : [item];
      }

      return { cart: updatedCart };
    }),
  setOpenConfirm: (state) => set({ openConfirm: state }),
  removeCartItem: (productId, variantId) =>
    set((state) => {
      const updatedCart = (state.cart ?? []).filter(
        (cartItem) => !(cartItem.product.id === productId && cartItem.variant?.id === variantId),
      );

      return { cart: updatedCart };
    }),
  resetCart: () => set({ cart: [] }),
}));
