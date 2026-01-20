import { Product } from "@/lib/api/products";
import { Purchase } from "@/lib/api/purchasing";
import { create } from "zustand";

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

interface ReturnPurchasingState {
  addProduct: Product | null;
  selectedPurchase: Purchase | null;
  cart: CartItem[];
  cartTotal: number;
  openConfirm: boolean;
  setOpenConfirm: (state: boolean) => void;
  setAddProduct: (state: Product | null) => void;
  setSelectedPurchase: (state: Purchase | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useReturnPurchasingStore = create<ReturnPurchasingState>(
  (set) => ({
    addProduct: null,
    selectedPurchase: null,
    cart: [],
    cartTotal: 0,
    openConfirm: false,
    setOpenConfirm: (state) => set({ openConfirm: state }),
    setAddProduct: (state) => set({ addProduct: state }),
    setSelectedPurchase: (state) => set({ selectedPurchase: state }),
    addCartItem: (item) =>
      set((state) => {
        const existingItemIndex = state.cart?.findIndex(
          (cartItem) => cartItem.product.id === item.product.id,
        );

        let updatedCart: CartItem[];

        if (
          existingItemIndex !== undefined &&
          existingItemIndex !== -1 &&
          state.cart
        ) {
          updatedCart = [...state.cart];
          updatedCart[existingItemIndex] = item;
        } else {
          updatedCart = state.cart ? [...state.cart, item] : [item];
        }

        return { cart: updatedCart };
      }),
    removeCartItem: (productId) =>
      set((state) => {
        const updatedCart = state.cart?.filter(
          (cartItem) => cartItem.product.id !== productId,
        );

        return { cart: updatedCart };
      }),
    resetCart: () => set({ cart: [], cartTotal: 0, selectedPurchase: null }),
  }),
);
