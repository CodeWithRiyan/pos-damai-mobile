import { ProductPrice, ProductVariant } from "./api/products";

export const findSellPrice = ({
  sellPrices,
  quantity = 0,
  type = "RETAIL",
  unitVariant,
}: {
  sellPrices: ProductPrice[];
  quantity?: number;
  type?: ProductPrice["type"];
  unitVariant?: ProductVariant;
}) => {
  if (!sellPrices.length) return 0;

  // 1. Priority: Variant-based pricing
  if (unitVariant) {
    const variantPrice = sellPrices.find((p) => p.label === unitVariant.name);
    if (variantPrice) return variantPrice.price;
  }

  // 2. Find the price that matches the type and quantity (Best Match)
  const getBestMatch = (targetType: ProductPrice["type"]) => {
    return sellPrices
      .filter((p) => p.type === targetType && p.minimumPurchase <= quantity)
      .sort((a, b) => b.minimumPurchase - a.minimumPurchase)[0];
  };

  const match = getBestMatch(type);
  if (match) return match.price;

  // 3. Fallback: If WHOLESALE is not found, try to find RETAIL that matches the quantity
  if (type === "WHOLESALE") {
    const retailMatch = getBestMatch("RETAIL");
    if (retailMatch) return retailMatch.price;
  }

  // 4. Last Resort: Take the RETAIL price with the smallest minimum purchase
  const basePrice = sellPrices
    .filter((p) => p.type === "RETAIL")
    .sort((a, b) => a.minimumPurchase - b.minimumPurchase)[0];

  return basePrice?.price ?? sellPrices[0]?.price ?? 0;
};
