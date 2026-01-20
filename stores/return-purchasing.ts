import { Product } from "@/lib/api/products";
import { create } from "zustand";

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
}

type ReturnPurchasingCheckoutResponse = {
  id: string;
  referenceNumber: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedById: string;
  updatedByName: string;
  updatedAt: string;
  items: CartItem[];
  totalPurchase: number;
  totalPaid: string;
  supplierId: string;
  isPayable: boolean;
  transactionDate: Date | null;
  dueDate: Date | null;
  isCashdrawer: boolean;
  status: string;
  note: string;
};

interface ReturnPurchasingState {
  addProduct: Product | null;
  cart: CartItem[];
  cartTotal: number;
  openConfirm: boolean;
  setOpenConfirm: (state: boolean) => void;
  setAddProduct: (state: Product | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string) => void;
  resetCart: () => void;
}

export const useReturnPurchasingStore = create<ReturnPurchasingState>(
  (set) => ({
    addProduct: null,
    cart: [],
    cartTotal: 0,
    openConfirm: false,
    setOpenConfirm: (state) => set({ openConfirm: state }),
    setAddProduct: (state) => set({ addProduct: state }),
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
    resetCart: () => set({ cart: [], cartTotal: 0 }),
  }),
);
