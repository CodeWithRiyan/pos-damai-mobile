import dayjs from 'dayjs';
import { CalcType, PriceType } from '@/constants';
import { ProductPrice, ProductVariant } from '@/hooks/use-product';

export const findSellPrice = ({
  sellPrices = [],
  quantity = 0,
  type = PriceType.RETAIL,
  unitVariant,
}: {
  sellPrices?: ProductPrice[];
  quantity?: number;
  type?: ProductPrice['type'];
  unitVariant?: ProductVariant;
}) => {
  if (!sellPrices.length) return 0;

  // 1. Priority: Variant-based pricing
  if (unitVariant && type === PriceType.RETAIL) {
    const variantPrice = sellPrices.find((p) => p.label === unitVariant.name);
    if (variantPrice) return variantPrice.price;
  }

  // 2. Find the price that matches the type and quantity (Best Match)
  const getBestMatch = (targetType: ProductPrice['type']) => {
    return sellPrices
      .filter((p) => p.type === targetType && p.minimumPurchase <= quantity)
      .sort((a, b) => b.minimumPurchase - a.minimumPurchase)[0];
  };

  const match = getBestMatch(type);
  if (match) return match.price;

  // 3. Fallback: If WHOLESALE is not found, try to find RETAIL that matches the quantity
  if (type === PriceType.WHOLESALE) {
    const retailMatch = getBestMatch(PriceType.RETAIL);
    if (retailMatch) return retailMatch.price;
  }

  // 4. Last Resort: Take the RETAIL price with the smallest minimum purchase
  const basePrice = sellPrices
    .filter((p) => p.type === PriceType.RETAIL)
    .sort((a, b) => a.minimumPurchase - b.minimumPurchase)[0];

  return basePrice?.price ?? sellPrices[0]?.price ?? 0;
};

export const isDiscountActive = (discount?: {
  startDate: Date | string;
  endDate: Date | string;
}) => {
  if (!discount) return false;
  const now = dayjs();
  const start = dayjs(discount.startDate).startOf('day');
  const end = dayjs(discount.endDate).endOf('day');

  return (now.isAfter(start) || now.isSame(start)) && (now.isBefore(end) || now.isSame(end));
};

export const getDiscountedPrice = (
  unitPrice: number,
  discount?: { nominal: number; type: 'FLAT' | 'PERCENTAGE' },
) => {
  if (!discount) return unitPrice;
  if (discount.type === CalcType.FLAT) {
    return Math.max(0, unitPrice - discount.nominal);
  } else {
    return Math.max(0, unitPrice * (1 - discount.nominal / 100));
  }
};

export const calculateLineItemTotal = ({
  quantity,
  unitPrice,
  discount,
  isManualPrice = false,
}: {
  quantity: number;
  unitPrice: number;
  discount?: {
    nominal: number;
    type: 'FLAT' | 'PERCENTAGE';
    startDate: Date | string;
    endDate: Date | string;
  };
  isManualPrice?: boolean;
}) => {
  if (quantity <= 0) return 0;

  // Skip auto-discount if price was manually overridden
  if (isManualPrice) {
    return quantity * unitPrice;
  }

  if (isDiscountActive(discount)) {
    const discountedPrice = getDiscountedPrice(unitPrice, discount);
    // 1st unit discounted, remaining at regular price
    return discountedPrice + (quantity - 1) * unitPrice;
  }

  return quantity * unitPrice;
};
