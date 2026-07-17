export interface CatalogColor {
  id: string;
  name: string;
  code: string;
  hex?: string;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: "CABINETS" | "FLOORING";
  subcategory: string | null;
  unit: "EACH" | "BOX";
  unitsPerBox: number | null;
  price: number | null;
  options: { name: string; values: unknown }[];
  colors: { color: CatalogColor }[];
}
