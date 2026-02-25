import { Customer } from "@/lib/api/customers";
import { Product, ProductVariant } from "@/lib/api/products";
import { findSellPrice } from "@/lib/price";
import { create } from "zustand";

interface CartItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  tempSellPrice?: number;
  note?: string;
}

type TransactionCheckoutResponse = {
  id: string;
  referenceNumber: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedById: string;
  updatedByName: string;
  updatedAt: string;
  items: CartItem[];
  totalItems: number;
  totalPaid: string;
  customerId: string;
  transactionDate: Date | null;
  isCashdrawer: boolean;
  status: string;
  note: string;
};

interface TransactionState {
  addProduct: Product | null;
  addProductVariantId: string | null;
  cart: CartItem[];
  cartTotal: number;
  checkoutData: TransactionCheckoutResponse | null;
  customer: Customer | null;
  status: "DRAFT" | "COMPLETED";
  purchaseId: string | null;
  setCustomer: (customer: Customer | null) => void;
  setPurchaseId: (id: string | null) => void;
  setStatus: (status: "DRAFT" | "COMPLETED") => void;
  setAddProduct: (state: Product | null, variantId?: string) => void;
  setCheckoutData: (state: TransactionCheckoutResponse | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string, variantId?: string) => void;
  resetCart: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  addProduct: null,
  addProductVariantId: null,
  cart: [],
  cartTotal: 0,
  checkoutData: null,
  customer: null,
  status: "DRAFT",
  purchaseId: null,
  setCustomer: (customer) =>
    set((state) => {
      const updatedTotal = state.cart.reduce(
        (sum, cartItem) =>
          sum +
          cartItem.quantity *
            (cartItem.tempSellPrice ||
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: customer?.category,
                quantity: cartItem.quantity,
                unitVariant: cartItem.variant,
              })),
        0,
      );
      return { customer, cartTotal: updatedTotal };
    }),
  setPurchaseId: (id) => set({ purchaseId: id }),
  setStatus: (status) => {
    set({ status });
  },
  setAddProduct: (state, variantId) =>
    set({ addProduct: state, addProductVariantId: variantId }),
  setCheckoutData: (state) => set({ checkoutData: state }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart?.findIndex(
        (cartItem) =>
          cartItem.product.id === item.product.id &&
          cartItem.variant?.id === item.variant?.id,
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

      const total = updatedCart.reduce(
        (sum, cartItem) =>
          sum +
          cartItem.quantity *
            (cartItem.tempSellPrice ||
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: state.customer?.category,
                quantity: cartItem.quantity,
                unitVariant: cartItem.variant,
              })),
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  removeCartItem: (productId, variantId) =>
    set((state) => {
      const updatedCart = state.cart?.filter(
        (cartItem) =>
          !(
            cartItem.product.id === productId &&
            cartItem.variant?.id === variantId
          ),
      );

      const total = updatedCart.reduce(
        (sum, cartItem) =>
          sum +
          cartItem.quantity *
            (cartItem.tempSellPrice ||
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: state.customer?.category,
                quantity: cartItem.quantity,
                unitVariant: cartItem.variant,
              })),
        0,
      );

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0, purchaseId: null }),
}));
