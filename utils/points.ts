import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface PointsEarnedResult {
  totalPoints: number;
  breakdown: {
    categoryId: string;
    categoryName: string;
    points: number;
    quantity: number;
  }[];
}

export async function calculateEarnedPoints(
  items: {
    productId: string;
    quantity: number;
    categoryId?: string;
  }[],
  customerCategory: string = 'RETAIL',
): Promise<PointsEarnedResult> {
  const breakdown: PointsEarnedResult['breakdown'] = [];
  let totalPoints = 0;

  const categoryMap = new Map<
    string,
    { categoryName: string; pointPerUnit: number; totalQuantity: number }
  >();

  for (const item of items) {
    if (!item.categoryId || item.quantity <= 0) continue;

    let entry = categoryMap.get(item.categoryId);

    if (!entry) {
      const category = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, item.categoryId))
        .limit(1);

      const cat = category[0];
      if (!cat) continue;

      const pointPerUnit =
        customerCategory === 'WHOLESALE'
          ? (cat.wholesalePoint ?? 0)
          : customerCategory === 'RETAIL'
            ? (cat.retailPoint ?? 0)
            : (cat.point ?? 0);

      entry = {
        categoryName: cat.name,
        pointPerUnit,
        totalQuantity: item.quantity,
      };

      categoryMap.set(item.categoryId, entry);
    } else {
      entry.totalQuantity += item.quantity;
    }
  }

  for (const [categoryId, entry] of categoryMap.entries()) {
    const points = entry.pointPerUnit * entry.totalQuantity;
    totalPoints += points;
    breakdown.push({
      categoryId,
      categoryName: entry.categoryName,
      points,
      quantity: entry.totalQuantity,
    });
  }

  return { totalPoints, breakdown };
}

export async function updateCustomerStats(
  customerId: string,
  totalAmount: number,
  totalProfit: number,
  earnedPoints: number,
): Promise<void> {
  await db
    .update(schema.customers)
    .set({
      points: sql`${schema.customers.points} + ${earnedPoints}`,
      totalTransactions: sql`${schema.customers.totalTransactions} + 1`,
      totalRevenue: sql`${schema.customers.totalRevenue} + ${totalAmount}`,
      totalProfit: sql`${schema.customers.totalProfit} + ${totalProfit}`,
      _dirty: true,
    })
    .where(eq(schema.customers.id, customerId));
}

export async function deductCustomerStats(
  customerId: string,
  totalAmount: number,
  totalProfit: number,
  earnedPoints: number,
): Promise<void> {
  await db
    .update(schema.customers)
    .set({
      points: sql`MAX(0, ${schema.customers.points} - ${earnedPoints})`,
      totalTransactions: sql`MAX(0, ${schema.customers.totalTransactions} - 1)`,
      totalRevenue: sql`MAX(0, ${schema.customers.totalRevenue} - ${totalAmount})`,
      totalProfit: sql`MAX(0, ${schema.customers.totalProfit} - ${totalProfit})`,
      _dirty: true,
    })
    .where(eq(schema.customers.id, customerId));
}
