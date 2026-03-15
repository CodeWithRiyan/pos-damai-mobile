import { Customer } from "@/lib/api/customers";
import { Product, ProductVariant } from "@/lib/api/products";
import { PriceType, Status } from "@/lib/constants";
import { BaseCartItem } from "@/lib/types/cart";
import { calculateLineItemTotal, findSellPrice } from "@/lib/price";
import { create } from "zustand";

interface CartItem extends BaseCartItem {
  variant?: ProductVariant;
  tempSellPrice?: number;
}

interface CheckoutData {
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
  totalAmount?: number;
  totalPaid: string;
  customerId: string;
  transactionDate: Date;
  status: string;
  note: string;
}

interface TransactionState {
  customer: Customer | null;
  cart: CartItem[];
  cartTotal: number;
  status: "DRAFT" | "COMPLETED";
  checkoutData: CheckoutData | null;
  purchaseId: string | null;
  addProduct: Product | null;
  addProductVariantId: string | null;
  setCustomer: (customer: Customer | null) => void;
  setPurchaseId: (id: string | null) => void;
  addCartItem: (item: CartItem) => void;
  removeCartItem: (productId: string, variantId?: string) => void;
  resetCart: () => void;
  setStatus: (status: "DRAFT" | "COMPLETED") => void;
  setCheckoutData: (data: CheckoutData | null) => void;
  setAddProduct: (product: Product | null, variantId?: string) => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  customer: null,
  cart: [],
  cartTotal: 0,
  status: Status.DRAFT,
  checkoutData: null,
  purchaseId: null,
  addProduct: null,
  addProductVariantId: null,
  setCustomer: (customer) =>
    set((state) => {
      const prevCategory = state.customer?.category;
      const nextCategory = customer?.category;
      const categoryChanged = prevCategory !== nextCategory;

      if (!categoryChanged) return { customer };

      const updatedCart = state.cart.map((cartItem) => {
        const updateTempSellPrice = () => {
          if (nextCategory === PriceType.RETAIL && cartItem.variant?.netto) {
            return undefined;
          } else if (nextCategory === PriceType.WHOLESALE && cartItem.variant?.netto) {
            return (
              findSellPrice({
                sellPrices: cartItem.product.sellPrices,
                type: PriceType.WHOLESALE,
                quantity: cartItem.quantity,
              }) * cartItem.variant.netto
            );
          }

          return cartItem.tempSellPrice;
        };

        return {
          ...cartItem,
          tempSellPrice: updateTempSellPrice(),
        };
      });

      const updatedTotal = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ??
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: nextCategory ?? PriceType.RETAIL,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return { customer, cartTotal: updatedTotal, cart: updatedCart };
    }),
  setPurchaseId: (id) => set({ purchaseId: id }),
  setStatus: (status) => set({ status }),
  setCheckoutData: (data) => set({ checkoutData: data }),
  setAddProduct: (product, variantId) =>
    set({ addProduct: product, addProductVariantId: variantId || null }),
  addCartItem: (item) =>
    set((state) => {
      const existingItemIndex = state.cart.findIndex(
        (i) =>
          i.product.id === item.product.id &&
          i.variant?.id === item.variant?.id,
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

      const total = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ||
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: state.customer?.category,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

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

      const total = updatedCart.reduce((sum, cartItem) => {
        const unitPrice =
          cartItem.tempSellPrice ||
          findSellPrice({
            sellPrices: cartItem.product.sellPrices,
            type: state.customer?.category,
            quantity: cartItem.quantity,
            unitVariant: cartItem.variant,
          });

        return (
          sum +
          calculateLineItemTotal({
            quantity: cartItem.quantity,
            unitPrice: unitPrice,
            discount: cartItem.product.discount,
            isManualPrice: !!cartItem.tempSellPrice,
          })
        );
      }, 0);

      return { cart: updatedCart, cartTotal: total };
    }),
  resetCart: () => set({ cart: [], cartTotal: 0, purchaseId: null }),
}));
