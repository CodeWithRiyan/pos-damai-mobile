import { ProductPrice } from "./api/products";

export const findSellPrice = ({
  sellPrices,
  quantity = 0,
  type = "RETAIL",
}: {
  sellPrices: ProductPrice[];
  quantity?: number;
  type?: ProductPrice["type"];
}) => {
  const sellPrice = sellPrices
    .filter((p) => p.type === type)
    .filter((p) => p.minimumPurchase <= quantity)
    .sort((a, b) => b.minimumPurchase - a.minimumPurchase)[0];

  if (sellPrice) return sellPrice.price;

  // Fallback 1: if type is WHOLESALE but no matching quantity, try RETAIL
  if (type === "WHOLESALE") {
    const retailPrice = sellPrices
      .filter((p) => p.type === "RETAIL")
      .filter((p) => p.minimumPurchase <= quantity)
      .sort((a, b) => b.minimumPurchase - a.minimumPurchase)[0];
    
    if (retailPrice) return retailPrice.price;
  }

  // Fallback 2: The base RETAIL price (lowest minimumPurchase)
  const basePrice = sellPrices
    .filter((p) => p.type === "RETAIL")
    .sort((a, b) => a.minimumPurchase - b.minimumPurchase)[0];

  return basePrice?.price || sellPrices[0]?.price || 0;
};
