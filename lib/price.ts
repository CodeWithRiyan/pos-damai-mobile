import { ProductPrice } from "./api/products";

export const findSellPrice = ({
  sellPrices,
  quantity,
  type = "RETAIL",
}: {
  sellPrices: ProductPrice[];
  quantity: number;
  type?: ProductPrice["type"];
}) => {
  const sellPrice = sellPrices
    .filter((p) => p.type === type)
    .filter((p) => p.minimumPurchase <= quantity)
    .sort((a, b) => b.minimumPurchase - a.minimumPurchase)[0];

  return sellPrice?.price || sellPrices[0]?.price || 0;
};
