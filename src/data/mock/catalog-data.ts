/**
 * Demo-mode catalog data — mirrors prisma/seed.ts exactly (same SKUs,
 * colors, thicknesses) so switching to a real database later doesn't
 * change what the UI shows. See src/lib/mode.ts.
 */

export interface MockColor {
  id: string;
  name: string;
  code: string;
  hex: string;
  sortOrder: number;
}

export interface MockProductOption {
  name: string;
  values: string[];
  isRequired: boolean;
}

export interface MockProduct {
  id: string;
  sku: string;
  name: string;
  category: "CABINETS" | "FLOORING";
  subcategory: string | null;
  unit: "EACH" | "BOX";
  unitsPerBox: number | null;
  supportsAssembly: boolean;
  sortOrder: number;
  tone?: string; // flooring swatch tone
  options: MockProductOption[];
  colors: { color: MockColor }[];
}

export const MOCK_COLORS: MockColor[] = [
  { id: "col-gs", name: "Grey Shaker", code: "GS", hex: "#a9adaf", sortOrder: 0 },
  { id: "col-nw", name: "Natural Wood", code: "NW", hex: "#c49a62", sortOrder: 1 },
  { id: "col-nb", name: "Navy Blue", code: "NB", hex: "#25395c", sortOrder: 2 },
  { id: "col-pg", name: "Pearl Glazed", code: "PG", hex: "#ebe3d1", sortOrder: 3 },
  { id: "col-sb", name: "Smokey Black", code: "SB", hex: "#2e2c2a", sortOrder: 4 },
  { id: "col-sw", name: "Super White", code: "SW", hex: "#fdfdfb", sortOrder: 5 },
  { id: "col-ws", name: "White Shaker", code: "WS", hex: "#f3f0e8", sortOrder: 6 },
];

const CABINET_DEFS: Array<[string, string, string]> = [
  ["B09", 'Base Cabinet 9"', "Base"],
  ["B12", 'Base Cabinet 12"', "Base"],
  ["B15", 'Base Cabinet 15"', "Base"],
  ["B18", 'Base Cabinet 18"', "Base"],
  ["B24", 'Base Cabinet 24"', "Base"],
  ["B30", 'Base Cabinet 30"', "Base"],
  ["B36", 'Base Cabinet 36"', "Base"],
  ["W1230", 'Wall Cabinet 12x30"', "Wall"],
  ["W1530", 'Wall Cabinet 15x30"', "Wall"],
  ["W1830", 'Wall Cabinet 18x30"', "Wall"],
  ["W2430", 'Wall Cabinet 24x30"', "Wall"],
  ["W3030", 'Wall Cabinet 30x30"', "Wall"],
  ["W3630", 'Wall Cabinet 36x30"', "Wall"],
  ["T1884", 'Tall Pantry 18x84"', "Tall"],
  ["T2484", 'Tall Pantry 24x84"', "Tall"],
  ["T3084", 'Tall Pantry 30x84"', "Tall"],
  ["V24", 'Vanity 24"', "Vanity"],
  ["V30", 'Vanity 30"', "Vanity"],
  ["V36", 'Vanity 36"', "Vanity"],
  ["V48", 'Vanity 48"', "Vanity"],
];

const FLOOR_TONES = [
  "#b3906a", "#9c7a55", "#c4a179", "#8a6f52", "#ab8a62",
  "#77604a", "#bfa07d", "#93765a", "#a5876b", "#87684d",
];

const FLOORING_DEFS: Array<[string, string[]]> = [
  ["JP1001", ["6.5mm"]],
  ["JP1003", ["4.5mm", "6.5mm"]],
  ["JP1006", ["4.5mm"]],
  ["JP1007", ["4.5mm"]],
  ["JP1008", ["4.5mm", "8.5mm"]],
  ["JP1010", ["6.5mm"]],
  ["JP1011", ["5.5mm"]],
  ["JP1012", ["6.0mm"]],
  ["JP1013", ["6.0mm"]],
  ["JP1014", ["6.0mm"]],
];

const allColorRefs = MOCK_COLORS.map((color) => ({ color }));

export const MOCK_PRODUCTS: MockProduct[] = [
  ...CABINET_DEFS.map(([sku, name, subcategory], i): MockProduct => ({
    id: `prod-${sku}`,
    sku,
    name,
    category: "CABINETS",
    subcategory,
    unit: "EACH",
    unitsPerBox: null,
    supportsAssembly: true,
    sortOrder: i,
    options: [],
    colors: allColorRefs,
  })),
  ...FLOORING_DEFS.map(([sku, thicknesses], i): MockProduct => ({
    id: `prod-${sku}`,
    sku,
    name: sku,
    category: "FLOORING",
    subcategory: "Plank",
    unit: "BOX",
    unitsPerBox: 23.4,
    supportsAssembly: false,
    sortOrder: i,
    tone: FLOOR_TONES[i % FLOOR_TONES.length],
    options: [{ name: "Thickness", values: thicknesses, isRequired: true }],
    colors: [],
  })),
];

export function findProduct(sku: string): MockProduct | undefined {
  return MOCK_PRODUCTS.find((p) => p.sku === sku);
}

export function findColor(code: string): MockColor | undefined {
  return MOCK_COLORS.find((c) => c.code === code);
}

// ── Tenancy / identity ──────────────────────────────────────────────

export type MockRole = "CUSTOMER_USER" | "CUSTOMER_ADMIN" | "STAFF" | "STAFF_ADMIN";

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: MockRole;
  accountId: string | null;
}

export const MOCK_ACCOUNT = {
  id: "acct-demo-001",
  name: "Demo Builders LLC",
  accountNumber: "DEMO-001",
};

export const MOCK_SHIP_TO = [
  {
    id: "ship-main",
    accountId: MOCK_ACCOUNT.id,
    label: "Main jobsite",
    line1: "123 Main St",
    line2: null,
    city: "St. Louis",
    state: "MO",
    zip: "63101",
    isDefault: true,
  },
  {
    id: "ship-shop",
    accountId: MOCK_ACCOUNT.id,
    label: "Shop",
    line1: "4410 Delor St",
    line2: null,
    city: "St. Louis",
    state: "MO",
    zip: "63116",
    isDefault: false,
  },
];

export const MOCK_USERS: MockUser[] = [
  {
    id: "user-buyer",
    email: "buyer@demobuilders.com",
    fullName: "Demo Buyer",
    role: "CUSTOMER_ADMIN",
    accountId: MOCK_ACCOUNT.id,
  },
  {
    id: "user-staff",
    email: "staff@cgwholesale.com",
    fullName: "C&G Staff",
    role: "STAFF_ADMIN",
    accountId: null,
  },
];

export function findUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
