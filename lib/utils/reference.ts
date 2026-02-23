import { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import { and, eq, like, desc, sql } from "drizzle-orm";

export type TransactionPrefix =
  | "TRX" // Penjualan (transactions)
  | "PUR" // Pembelian (purchases)
  | "RTS" // Retur Penjualan (return_transactions)
  | "RTP" // Retur Pembelian (purchase_returns)
  | "FIN" // Keuangan (finances)
  | "SO"  // Stock Opname (stock_opnames)
  | "PAY" // Hutang (payables / payable_realizations)
  | "REC"; // Piutang (receivables / receivable_realizations)

/**
 * Mendapatkan bagian terformat dari sebuah local_ref_id untuk digunakan di UI
 * Contoh: membuang 'TRX-' menjadi '22-02-26-0001'
 */
export function formatDisplayRefId(localRefId: string | null | undefined): string {
  if (!localRefId) return "-";
  
  const parts = localRefId.split("-");
  
  if (parts.length >= 5) {
    return parts.slice(1).join("-");
  }

  return localRefId;
}

/**
 * Generate a sequential local_ref_id
 * Format: [PREFIX]-DD-MM-YY-XXXX (ex: TRX-22-02-26-0001)
 */
export async function generateLocalRefId(
  db: any, 
  table: any,
  prefix: TransactionPrefix,
): Promise<string> {
  const now = new Date();
  
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  
  const dateStr = `${dd}-${mm}-${yy}`;
  const searchPattern = `${prefix}-${dateStr}-%`;

  const records = await db
    .select({ refId: table.local_ref_id })
    .from(table)
    .where(like(table.local_ref_id, searchPattern))
    .orderBy(desc(table.local_ref_id))
    .limit(1);

  let sequence = 1;

  if (records.length > 0 && records[0].refId) {
    const lastRefId = records[0].refId;
    const parts = lastRefId.split("-");
    
    if (parts.length === 5) {
      const lastSeq = parseInt(parts[4], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
  }

  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}-${dateStr}-${sequenceStr}`;
}
