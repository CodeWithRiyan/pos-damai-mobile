import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import XLSX from "xlsx";
import { Brand, CreateBrandDTO } from "../api/brands";
import { Category, CreateCategoryDTO } from "../api/categories";
import {
  CreateCustomerDTO,
  Customer,
  CustomerCategory,
} from "../api/customers";
import { PayableBySupplier } from "../api/payable";
import { CreatePaymentTypeDTO, PaymentType } from "../api/payment-types";
import { CreateProductDTO, Product, ProductPrice } from "../api/products";
import { Role } from "../api/roles";
import { CreateSupplierDTO, Supplier } from "../api/suppliers";
import { CreateUserDTO, User } from "../api/users";

// ─── Generic helpers ──────────────────────────────────────────────────────────

async function writeXlsxAndShare(
  rows: Record<string, unknown>[],
  filename: string,
): Promise<void> {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");

  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing tidak tersedia di perangkat ini.");
  }
  await Sharing.shareAsync(fileUri, {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    dialogTitle: `Ekspor ${filename}`,
  });
}

async function pickAndReadXlsx(): Promise<Record<string, unknown>[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ],
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const fileUri = result.assets[0].uri;
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const wb = XLSX.read(base64, { type: "base64" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
  });
  return rows;
}

function str(val: unknown): string {
  return String(val ?? "").trim();
}

function num(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function bool(val: unknown): boolean {
  const s = str(val).toLowerCase();
  return s === "ya" || s === "true" || s === "1" || s === "yes";
}

// ─── Brand ────────────────────────────────────────────────────────────────────

export async function exportBrands(brands: Brand[]): Promise<void> {
  const rows = brands.map((b) => ({
    Nama: b.name,
    Deskripsi: b.description ?? "",
  }));
  await writeXlsxAndShare(rows, "brand.xlsx");
}

export async function importBrands(): Promise<CreateBrandDTO[] | null> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  return rows
    .map((r) => ({
      name: str(r["Nama"]),
      description: str(r["Deskripsi"]) || undefined,
    }))
    .filter((d) => d.name.length > 0);
}

// ─── Category ─────────────────────────────────────────────────────────────────

export async function exportCategories(categories: Category[]): Promise<void> {
  const rows = categories.map((c) => ({
    Nama: c.name,
    "Poin Retail": c.retailPoint ?? 0,
    "Poin Grosir": c.wholesalePoint ?? 0,
    "Poin Umum": c.point ?? 0,
    Deskripsi: c.description ?? "",
  }));
  await writeXlsxAndShare(rows, "kategori.xlsx");
}

export async function importCategories(): Promise<CreateCategoryDTO[] | null> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  return rows
    .map((r) => ({
      name: str(r["Nama"]),
      retailPoint: num(r["Poin Retail"]),
      wholesalePoint: num(r["Poin Grosir"]),
      point: num(r["Poin Umum"]),
      description: str(r["Deskripsi"]) || undefined,
    }))
    .filter((d) => d.name.length > 0);
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export async function exportCustomers(customers: Customer[]): Promise<void> {
  const rows = customers.map((c) => ({
    Nama: c.name,
    Kode: c.code ?? "",
    Kategori: c.category ?? "RETAIL",
    Telepon: c.phone ?? "",
    Alamat: c.address ?? "",
  }));
  await writeXlsxAndShare(rows, "pelanggan.xlsx");
}

export async function importCustomers(): Promise<CreateCustomerDTO[] | null> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  return rows
    .map((r) => {
      const category = str(r["Kategori"]).toUpperCase();
      return {
        name: str(r["Nama"]),
        code: str(r["Kode"]) || undefined,
        category: (category === "WHOLESALE"
          ? "WHOLESALE"
          : "RETAIL") as CustomerCategory,
        phone: str(r["Telepon"]) || undefined,
        address: str(r["Alamat"]) || undefined,
      };
    })
    .filter((d) => d.name.length > 0);
}

// ─── Payable (export only – read-only financial data) ─────────────────────────

export async function exportPayables(
  payables: PayableBySupplier[],
): Promise<void> {
  const rows = payables.map((p) => ({
    Supplier: p.supplierName,
    "Total Hutang": p.totalPayable,
    "Total Realisasi": p.totalRealization,
    "Sisa Hutang": p.totalPayable - p.totalRealization,
    "Jatuh Tempo Terdekat": p.nearestDueDate
      ? new Date(p.nearestDueDate).toLocaleDateString("id-ID")
      : "-",
    Status: p.totalRealization >= p.totalPayable ? "Lunas" : "Belum Lunas",
    Telepon: p.phone ?? "",
    Alamat: p.address ?? "",
  }));
  await writeXlsxAndShare(rows, "hutang.xlsx");
}

// ─── Payment Type ─────────────────────────────────────────────────────────────

export async function exportPaymentTypes(
  paymentTypes: PaymentType[],
): Promise<void> {
  const rows = paymentTypes.map((p) => ({
    Nama: p.name,
    "Tipe Komisi": p.commissionType,
    Komisi: p.commission,
    "Minimal Transaksi": p.minimalAmount,
    Default: p.isDefault ? "Ya" : "Tidak",
  }));
  await writeXlsxAndShare(rows, "jenis-pembayaran.xlsx");
}

export async function importPaymentTypes(): Promise<
  CreatePaymentTypeDTO[] | null
> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  return rows
    .map((r) => {
      const commissionTypeRaw = str(r["Tipe Komisi"]).toUpperCase();
      const commissionType: "FLAT" | "PERCENTAGE" =
        commissionTypeRaw === "FLAT" ? "FLAT" : "PERCENTAGE";
      return {
        name: str(r["Nama"]),
        commissionType,
        commission: num(r["Komisi"]),
        minimalAmount: num(r["Minimal Transaksi"]),
        isDefault: bool(r["Default"]),
      };
    })
    .filter((d) => d.name.length > 0);
}

// ─── Product ──────────────────────────────────────────────────────────────────

export async function exportProducts(products: Product[]): Promise<void> {
  const rows = products.map((p) => {
    const retailPrice =
      p.sellPrices?.find((sp: ProductPrice) => sp.type === "RETAIL")?.price ??
      0;
    const retailMin =
      p.sellPrices?.find((sp: ProductPrice) => sp.type === "RETAIL")
        ?.minimumPurchase ?? 1;
    const wholesalePrice =
      p.sellPrices?.find((sp: ProductPrice) => sp.type === "WHOLESALE")
        ?.price ?? 0;
    const wholesaleMin =
      p.sellPrices?.find((sp: ProductPrice) => sp.type === "WHOLESALE")
        ?.minimumPurchase ?? 0;

    return {
      Nama: p.name,
      Kode: p.code ?? p.barcode ?? "",
      "Harga Beli": p.purchasePrice,
      Stok: p.stock ?? 0,
      "Stok Minimum": p.minimumStock ?? 0,
      Satuan: p.unit ?? "",
      Tipe: p.type,
      "Harga Jual Retail": retailPrice,
      "Min Beli Retail": retailMin,
      "Harga Jual Grosir": wholesalePrice,
      "Min Beli Grosir": wholesaleMin,
      Deskripsi: p.description ?? "",
      Aktif: p.isActive ? "Ya" : "Tidak",
      Favorit: p.isFavorite ? "Ya" : "Tidak",
    };
  });
  await writeXlsxAndShare(rows, "produk.xlsx");
}

export async function importProducts(
  categories: { id: string; name: string }[],
): Promise<CreateProductDTO[] | null> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  const results: CreateProductDTO[] = [];

  for (const r of rows) {
    const name = str(r["Nama"]);
    if (!name) continue;

    const categoryName = str(r["Kategori"]);
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );

    // Fallback to first category if not found
    const categoryId = category?.id ?? categories[0]?.id ?? "";

    const prices: Omit<ProductPrice, "id">[] = [];

    const retailPrice = num(r["Harga Jual Retail"]);
    if (retailPrice > 0) {
      prices.push({
        label: "Retail",
        price: retailPrice,
        minimumPurchase: num(r["Min Beli Retail"]) || 1,
        type: "RETAIL",
      });
    }

    const wholesalePrice = num(r["Harga Jual Grosir"]);
    if (wholesalePrice > 0) {
      prices.push({
        label: "Grosir",
        price: wholesalePrice,
        minimumPurchase: num(r["Min Beli Grosir"]) || 1,
        type: "WHOLESALE",
      });
    }

    const typeRaw = str(r["Tipe"]).toUpperCase();
    const type: "DEFAULT" | "MULTIUNIT" | "VARIANTS" =
      typeRaw === "MULTIUNIT"
        ? "MULTIUNIT"
        : typeRaw === "VARIANTS"
          ? "VARIANTS"
          : "DEFAULT";

    results.push({
      name,
      code: str(r["Kode"]) || name.substring(0, 8).toUpperCase(),
      purchasePrice: num(r["Harga Beli"]),
      stock: num(r["Stok"]),
      minimumStock: num(r["Stok Minimum"]),
      unit: str(r["Satuan"]) || null,
      type,
      categoryId,
      description: str(r["Deskripsi"]) || undefined,
      isActive: str(r["Aktif"]) !== "Tidak",
      isFavorite: bool(r["Favorit"]),
      prices,
    });
  }

  return results;
}

// ─── Role (export only – system managed) ─────────────────────────────────────

export async function exportRoles(roles: Role[]): Promise<void> {
  const rows = roles.map((r) => ({
    Nama: r.name,
    Deskripsi: r.description ?? "",
    Level: r.level,
    "Sistem?": r.isSystem ? "Ya" : "Tidak",
  }));
  await writeXlsxAndShare(rows, "role.xlsx");
}

// ─── Supplier ─────────────────────────────────────────────────────────────────

export async function exportSuppliers(suppliers: Supplier[]): Promise<void> {
  const rows = suppliers.map((s) => ({
    Nama: s.name,
    Telepon: s.phone ?? "",
    Alamat: s.address ?? "",
  }));
  await writeXlsxAndShare(rows, "supplier.xlsx");
}

export async function importSuppliers(): Promise<
  Omit<CreateSupplierDTO, "createdBy" | "updatedBy" | "deletedAt">[] | null
> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  return rows
    .map((r) => ({
      name: str(r["Nama"]),
      phone: str(r["Telepon"]) || null,
      address: str(r["Alamat"]) || null,
    }))
    .filter((d) => d.name.length > 0);
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function exportUsers(users: User[]): Promise<void> {
  const rows = users.map((u) => ({
    Nama: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username,
    Username: u.username,
    Role: u.roles?.[0]?.role?.name ?? "",
    "Akun Aktif": u.isActive ? "Ya" : "Tidak",
    "Terakhir Login": u.lastLoginAt
      ? new Date(u.lastLoginAt).toLocaleDateString("id-ID")
      : "-",
  }));
  await writeXlsxAndShare(rows, "karyawan.xlsx");
}

export async function importUsers(
  roles: { id: string; name: string }[],
): Promise<CreateUserDTO[] | null> {
  const rows = await pickAndReadXlsx();
  if (!rows) return null;

  const results: CreateUserDTO[] = [];

  for (const r of rows) {
    const name = str(r["Nama"]);
    const username = str(r["Username"]);
    const password = str(r["Password"]);
    const roleName = str(r["Role"]);

    if (!name || !username || !password) continue;

    const role = roles.find(
      (ro) => ro.name.toLowerCase() === roleName.toLowerCase(),
    );
    if (!role) continue;

    results.push({
      name,
      username,
      password,
      roleId: role.id,
    });
  }

  return results;
}
