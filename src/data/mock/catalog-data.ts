/**
 * Demo-mode catalog data - mirrors prisma/seed.ts exactly (same SKUs,
 * colors, thicknesses) so switching to a real database later doesn't
 * change what the UI shows. See src/lib/mode.ts.
 *
 * Cabinet SKUs + prices are transcribed from the Jan-26 Cabinet Price
 * Sheet (ws04.24).
 */

import { CABINET_COLORS } from "@/config/colors";
import type { Role } from "@/types/domain";

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
  price: number | null;
  tone?: string; // flooring swatch tone
  options: MockProductOption[];
  colors: { color: MockColor }[];
}

// Derived from the canonical finish list (src/config/colors.ts) so a
// color is defined in exactly one place; the demo store just adds an id.
export const MOCK_COLORS: MockColor[] = CABINET_COLORS.map((c) => ({
  id: `col-${c.code.toLowerCase()}`,
  name: c.name,
  code: c.code,
  hex: c.hex,
  sortOrder: c.sortOrder,
}));

// [sku, price, name, subcategory] - full Jan-26 price sheet.
const CABINET_DEFS: Array<[string, number, string, string]> = [
  // ── Base Cabinets - 1 door, 1 drawer, 1 shelf (34.5" tall, 24" deep) ──
  ["B09", 279.13, 'Base Cabinet 9" - 1 Door, 1 Drawer', "Base"],
  ["B12", 323.13, 'Base Cabinet 12" - 1 Door, 1 Drawer', "Base"],
  ["B15", 358.88, 'Base Cabinet 15" - 1 Door, 1 Drawer', "Base"],
  ["B18", 390.50, 'Base Cabinet 18" - 1 Door, 1 Drawer', "Base"],
  ["B21", 441.38, 'Base Cabinet 21" - 1 Door, 1 Drawer', "Base"],
  // ── Base Cabinets - 2 door, 1 drawer, 1 shelf ──
  ["B24", 489.50, 'Base Cabinet 24" - 2 Door, 1 Drawer', "Base"],
  ["B27", 547.25, 'Base Cabinet 27" - 2 Door, 1 Drawer', "Base"],
  ["B30", 653.13, 'Base Cabinet 30" - 2 Door, 1 Drawer', "Base"],
  ["B33", 683.38, 'Base Cabinet 33" - 2 Door, 1 Drawer', "Base"],
  ["B36", 721.88, 'Base Cabinet 36" - 2 Door, 1 Drawer', "Base"],
  ["B42", 768.63, 'Base Cabinet 42" - 2 Door, 1 Drawer', "Base"],
  // ── Sink Base Cabinets - 2 doors, 1 dummy drawer ──
  ["SB24", 453.75, 'Sink Base Cabinet 24"', "Base"],
  ["SB27", 496.38, 'Sink Base Cabinet 27"', "Base"],
  ["SB30", 534.88, 'Sink Base Cabinet 30"', "Base"],
  ["SB33", 552.75, 'Sink Base Cabinet 33"', "Base"],
  ["SB36", 574.75, 'Sink Base Cabinet 36"', "Base"],
  ["SB42", 622.88, 'Sink Base Cabinet 42"', "Base"],
  // ── Base Drawer Cabinets - 3 drawers ──
  ["DB09-3", 457.63, 'Base Drawer Cabinet 9" - 3 Drawer', "Base"],
  ["DB12-3", 482.63, 'Base Drawer Cabinet 12" - 3 Drawer', "Base"],
  ["DB15-3", 506.00, 'Base Drawer Cabinet 15" - 3 Drawer', "Base"],
  ["DB18-3", 536.25, 'Base Drawer Cabinet 18" - 3 Drawer', "Base"],
  ["DB21-3", 577.50, 'Base Drawer Cabinet 21" - 3 Drawer', "Base"],
  ["DB24-3", 613.25, 'Base Drawer Cabinet 24" - 3 Drawer', "Base"],
  ["DB27-3", 692.31, 'Base Drawer Cabinet 27" - 3 Drawer', "Base"],
  ["DB30-3", 771.38, 'Base Drawer Cabinet 30" - 3 Drawer', "Base"],
  ["DB33-3", 787.88, 'Base Drawer Cabinet 33" - 3 Drawer', "Base"],
  ["DB36-3", 818.13, 'Base Drawer Cabinet 36" - 3 Drawer', "Base"],
  // ── Micro Cabinet (finished inside) ──
  ["DB24-MICRO-FIN", 860.78, 'Microwave Base Cabinet 24" - Finished Inside', "Base"],
  ["DB27-MICRO-FIN", 900.88, 'Microwave Base Cabinet 27" - Finished Inside', "Base"],
  ["DB30-MICRO-FIN", 946.88, 'Microwave Base Cabinet 30" - Finished Inside', "Base"],
  // ── Farm Sink Base ──
  ["FSB33", 706.13, 'Farm Sink Base 33" - 30" Sink Cutout', "Base"],
  ["FSB36", 756.13, 'Farm Sink Base 36" - 33" Sink Cutout', "Base"],
  // ── Corner Sink Cabinet - 1 door ──
  ["CSB36", 826.38, 'Corner Sink Cabinet 36"', "Base"],
  ["CSB42", 951.38, 'Corner Sink Cabinet 42"', "Base"],
  // ── Lazy Susan Cabinet - folding doors, wood Lazy Susan included ──
  ["LS3612", 966.63, 'Lazy Susan Cabinet 36x12"', "Base"],
  ["LS3312", 825.00, 'Lazy Susan Cabinet 33x12"', "Base"],
  // ── Corner Diagonal Cabinet - 1 door, includes shelf ──
  ["BDC36", 892.00, 'Corner Diagonal Cabinet 36" - Shelf Only', "Base"],
  ["BDC36LS", 220.00, 'Corner Diagonal Cabinet 36" - Lazy Susan Add-On', "Base"],
  // ── Blind Base Corner Cabinet - 1 door, 1 drawer, 1 shelf ──
  ["BBC36L", 551.38, 'Blind Base Corner Cabinet 36" - 12" Door, Left', "Base"],
  ["BBC36R", 551.38, 'Blind Base Corner Cabinet 36" - 12" Door, Right', "Base"],
  ["BBC39L", 609.13, 'Blind Base Corner Cabinet 39" - 15" Door, Left (pulls to 42")', "Base"],
  ["BBC39R", 609.13, 'Blind Base Corner Cabinet 39" - 15" Door, Right (pulls to 42")', "Base"],
  ["BBC42L", 666.88, 'Blind Base Corner Cabinet 42" - 18" Door, Left (pulls to 45")', "Base"],
  ["BBC42R", 666.88, 'Blind Base Corner Cabinet 42" - 18" Door, Right (pulls to 45")', "Base"],
  // ── Base Waste Cabinet - 1 door, 1 drawer ──
  ["BWBK15", 404.25, 'Base Waste Cabinet 15" - Single', "Base"],
  ["BWBK18-2", 596.88, 'Base Waste Cabinet 18" - Double', "Base"],
  ["TRASHCAN", 45.00, "Pull-Out Trash Can", "Accessory"],
  ["BSR9", 306.63, 'Base Spice Pull-Out 9"', "Base"],
  ["FB09", 269.13, 'Full Height Door Base Cabinet 9"', "Base"],
  ["BSR12", 346.63, 'Base Spice Pull-Out 12"', "Base"],
  // ── Spice Drawer - 5 spice drawers, no glides, 6x24x34.5 ──
  ["BSDC6", 321.75, 'Spice Drawer Cabinet 6" (5 Drawers)', "Base"],
  // ── Base Angle End - 2 doors, 1 shelf, 2 dummy drawers ──
  ["BEC24", 622.88, "Base Angle End Cabinet 24x24x18.375x18.375", "Base"],
  // ── Base Open Shelf - 3 shelves, 9x24x34.5 ──
  ["BES9R", 357.50, 'Base Open Shelf 9" - Right', "Base"],
  ["BES9L", 357.50, 'Base Open Shelf 9" - Left', "Base"],
  // ── Knee Drawer - 21" deep ──
  ["FD24", 235.13, 'Knee Drawer 24"', "Base"],
  ["FD27", 253.00, 'Knee Drawer 27"', "Base"],
  ["FD30", 284.63, 'Knee Drawer 30"', "Base"],
  ["FD33", 320.00, 'Knee Drawer 33"', "Base"],
  ["FD36", 359.26, 'Knee Drawer 36"', "Base"],

  // ── Wall Cabinets - 1 door, 2 shelves, 12" deep ──
  ["W0930", 170.50, 'Wall Cabinet 9x30"', "Wall"],
  ["W1230", 207.63, 'Wall Cabinet 12x30"', "Wall"],
  ["W1530", 250.25, 'Wall Cabinet 15x30"', "Wall"],
  ["W1830", 266.75, 'Wall Cabinet 18x30"', "Wall"],
  ["W2130", 316.25, 'Wall Cabinet 21x30"', "Wall"],
  ["W0936", 202.13, 'Wall Cabinet 9x36"', "Wall"],
  ["W1236", 237.88, 'Wall Cabinet 12x36"', "Wall"],
  ["W1536", 281.88, 'Wall Cabinet 15x36"', "Wall"],
  ["W1836", 298.38, 'Wall Cabinet 18x36"', "Wall"],
  ["W2136", 347.88, 'Wall Cabinet 21x36"', "Wall"],
  // ── Wall Cabinets - 1 door, 3 shelves, 12" deep ──
  ["W0942", 228.25, 'Wall Cabinet 9x42"', "Wall"],
  ["W1242", 265.38, 'Wall Cabinet 12x42"', "Wall"],
  ["W1542", 305.25, 'Wall Cabinet 15x42"', "Wall"],
  ["W1842", 325.88, 'Wall Cabinet 18x42"', "Wall"],
  ["W2142", 375.38, 'Wall Cabinet 21x42"', "Wall"],
  // ── Wall Cabinets - 2 doors, 2 shelves, 12" deep ──
  ["W2430", 330.00, 'Wall Cabinet 24x30"', "Wall"],
  ["W2730", 372.63, 'Wall Cabinet 27x30"', "Wall"],
  ["W3030", 415.25, 'Wall Cabinet 30x30"', "Wall"],
  ["W3330", 437.25, 'Wall Cabinet 33x30"', "Wall"],
  ["W3630", 459.25, 'Wall Cabinet 36x30"', "Wall"],
  ["W4230", 503.25, 'Wall Cabinet 42x30"', "Wall"],
  ["W2436", 360.25, 'Wall Cabinet 24x36"', "Wall"],
  ["W2736", 404.25, 'Wall Cabinet 27x36"', "Wall"],
  ["W3036", 467.50, 'Wall Cabinet 30x36"', "Wall"],
  ["W3336", 492.25, 'Wall Cabinet 33x36"', "Wall"],
  ["W3636", 515.63, 'Wall Cabinet 36x36"', "Wall"],
  ["W4236", 536.25, 'Wall Cabinet 42x36"', "Wall"],
  // ── Wall Cabinets - 2 doors, 3 shelves, 12" deep ──
  ["W2442", 387.75, 'Wall Cabinet 24x42"', "Wall"],
  ["W2742", 430.38, 'Wall Cabinet 27x42"', "Wall"],
  ["W3042", 519.75, 'Wall Cabinet 30x42"', "Wall"],
  ["W3342", 533.50, 'Wall Cabinet 33x42"', "Wall"],
  ["W3642", 547.25, 'Wall Cabinet 36x42"', "Wall"],
  ["W4242", 562.38, 'Wall Cabinet 42x42"', "Wall"],
  // ── Wall Cabinet Bridge - 2 doors, 12" deep ──
  ["W3012", 240.63, 'Wall Bridge Cabinet 30x12"', "Wall"],
  ["W3015", 257.13, 'Wall Bridge Cabinet 30x15"', "Wall"],
  ["W3018", 290.13, 'Wall Bridge Cabinet 30x18"', "Wall"],
  ["W3021", 343.75, 'Wall Bridge Cabinet 30x21"', "Wall"],
  ["W3024", 369.88, 'Wall Bridge Cabinet 30x24"', "Wall"],
  ["W3312", 276.38, 'Wall Bridge Cabinet 33x12"', "Wall"],
  ["W3315", 295.63, 'Wall Bridge Cabinet 33x15"', "Wall"],
  ["W3318", 316.25, 'Wall Bridge Cabinet 33x18"', "Wall"],
  ["W3321", 363.75, 'Wall Bridge Cabinet 33x21"', "Wall"],
  ["W3324", 386.50, 'Wall Bridge Cabinet 33x24"', "Wall"],
  ["W3612", 295.63, 'Wall Bridge Cabinet 36x12"', "Wall"],
  ["W3615", 316.25, 'Wall Bridge Cabinet 36x15"', "Wall"],
  ["W3618", 336.88, 'Wall Bridge Cabinet 36x18"', "Wall"],
  ["W3621", 398.75, 'Wall Bridge Cabinet 36x21"', "Wall"],
  ["W3624", 404.25, 'Wall Bridge Cabinet 36x24"', "Wall"],
  // ── Refrigerator Wall - 2 doors, 27" deep ──
  ["W331227", 400.40, 'Refrigerator Wall Cabinet 33x12x27"', "Wall"],
  ["W331527", 430.43, 'Refrigerator Wall Cabinet 33x15x27"', "Wall"],
  ["W331827", 460.46, 'Refrigerator Wall Cabinet 33x18x27"', "Wall"],
  ["W332427", 485.49, 'Refrigerator Wall Cabinet 33x24x27"', "Wall"],
  ["W361227", 440.00, 'Refrigerator Wall Cabinet 36x12x27"', "Wall"],
  ["W361527", 473.00, 'Refrigerator Wall Cabinet 36x15x27"', "Wall"],
  ["W361827", 506.00, 'Refrigerator Wall Cabinet 36x18x27"', "Wall"],
  ["W362427", 533.50, 'Refrigerator Wall Cabinet 36x24x27"', "Wall"],
  // ── Wall Diagonal Cabinet - 1 door, 2 shelves (42" = 3 shelves) ──
  ["WDC2430", 437.25, 'Wall Diagonal Cabinet 24x30"', "Wall"],
  ["WDC2436", 501.88, 'Wall Diagonal Cabinet 24x36"', "Wall"],
  ["WDC2442", 554.13, 'Wall Diagonal Cabinet 24x42"', "Wall"],
  ["WDC273015", 537.50, 'Wall Diagonal Cabinet 27x30x15"', "Wall"],
  ["WDC273615", 565.13, 'Wall Diagonal Cabinet 27x36x15"', "Wall"],
  ["WDC274215", 614.63, 'Wall Diagonal Cabinet 27x42x15"', "Wall"],
  ["WDCMD2430", 742.50, 'Wall Diagonal Cabinet 24x30" - Mullion Door', "Wall"],
  ["WDCMD2436", 797.50, 'Wall Diagonal Cabinet 24x36" - Mullion Door', "Wall"],
  ["WDCMD2442", 806.25, 'Wall Diagonal Cabinet 24x42" - Mullion Door', "Wall"],
  ["WDCMD273015", 825.00, 'Wall Diagonal Cabinet 27x30x15" - Mullion Door', "Wall"],
  ["WDCMD273615", 850.00, 'Wall Diagonal Cabinet 27x36x15" - Mullion Door', "Wall"],
  ["WDCMD274215", 880.00, 'Wall Diagonal Cabinet 27x42x15" - Mullion Door', "Wall"],
  // ── Wall Easy Reach Cabinet - 1 door, 2 shelves (42" = 3 shelves) ──
  ["WLS2430", 616.00, 'Wall Easy Reach Cabinet 24x30"', "Wall"],
  ["WLS2436", 694.38, 'Wall Easy Reach Cabinet 24x36"', "Wall"],
  ["WLS2442", 760.38, 'Wall Easy Reach Cabinet 24x42"', "Wall"],
  // ── Wall Blind Corner Cabinet - custom build, 6" center stile, 15" door ──
  ["WBC3030R", 672.63, 'Wall Blind Corner Cabinet 30x30" - Right', "Wall"],
  ["WBC3030L", 672.63, 'Wall Blind Corner Cabinet 30x30" - Left', "Wall"],
  ["WBC3036R", 704.25, 'Wall Blind Corner Cabinet 30x36" - Right', "Wall"],
  ["WBC3036L", 704.25, 'Wall Blind Corner Cabinet 30x36" - Left', "Wall"],
  ["WBC3042R", 730.38, 'Wall Blind Corner Cabinet 30x42" - Right', "Wall"],
  ["WBC3042L", 730.38, 'Wall Blind Corner Cabinet 30x42" - Left', "Wall"],
  // ── Wall End Shelf - 2 shelves, 9"w x 12"d ──
  ["WES0930R", 196.63, 'Wall End Shelf 9x30" - Right', "Wall"],
  ["WES0930L", 196.63, 'Wall End Shelf 9x30" - Left', "Wall"],
  ["WES0936R", 217.25, 'Wall End Shelf 9x36" - Right', "Wall"],
  ["WES0936L", 217.25, 'Wall End Shelf 9x36" - Left', "Wall"],
  ["WES0942R", 244.75, 'Wall End Shelf 9x42" - Right (3 Shelves)', "Wall"],
  ["WES0942L", 244.75, 'Wall End Shelf 9x42" - Left (3 Shelves)', "Wall"],
  // ── Wall End Cabinet - 2 doors, 2 shelves, 12"w x 12"d ──
  ["WEC1230", 254.38, 'Wall End Cabinet 12x30"', "Wall"],
  ["WEC1236", 305.25, 'Wall End Cabinet 12x36"', "Wall"],
  ["WEC1242", 332.75, 'Wall End Cabinet 12x42"', "Wall"],
  // ── Specialty Walls ──
  ["WRC3015", 273.63, 'Wine Rack Cabinet 30x15x12" - 10 Bottles', "Wall"],
  ["WRC3615", 316.25, 'Wine Rack Cabinet 36x15x12" (Special Order)', "Wall"],
  ["SGH3012", 116.88, 'Glass Rack Cabinet 30x12" - 8 Slots', "Wall"],
  ["SGH3612", 160.88, 'Glass Rack Cabinet 36x12" - 10 Slots', "Wall"],
  // ── Micro Shelf (microwave wall cabinet, 12" deep) ──
  ["WMW2730", 638.00, 'Microwave Wall Cabinet 27x30" (Pearl Cream only)', "Wall"],
  ["WMW2736", 665.50, 'Microwave Wall Cabinet 27x36"', "Wall"],
  ["WMW2742", 687.50, 'Microwave Wall Cabinet 27x42"', "Wall"],
  ["WMW3030", 673.75, 'Microwave Wall Cabinet 30x30" (Pearl Cream only)', "Wall"],
  ["WMW3036", 706.75, 'Microwave Wall Cabinet 30x36"', "Wall"],
  ["WMW3042", 753.50, 'Microwave Wall Cabinet 30x42"', "Wall"],

  // ── Tall Pantry - 27" deep ──
  ["PC188427", 1291.13, 'Tall Pantry 18x84x27"', "Tall"],
  ["PC189027", 1318.63, 'Tall Pantry 18x90x27"', "Tall"],
  ["PC189627", 1346.13, 'Tall Pantry 18x96x27"', "Tall"],
  ["PC248427", 1340.63, 'Tall Pantry 24x84x27"', "Tall"],
  ["PC249027", 1368.13, 'Tall Pantry 24x90x27"', "Tall"],
  ["PC249627", 1395.63, 'Tall Pantry 24x96x27"', "Tall"],
  ["PC308427", 1551.00, 'Tall Pantry 30x84x27"', "Tall"],
  ["PC309027", 1617.00, 'Tall Pantry 30x90x27"', "Tall"],
  ["PC309627", 1705.00, 'Tall Pantry 30x96x27"', "Tall"],
  // ── Double Oven Cabinet - 27" deep ──
  ["DOC308427", 1204.50, 'Double Oven Cabinet 30x84x27" (28.5" max cutout)', "Tall"],
  ["DOC309027", 1223.75, 'Double Oven Cabinet 30x90x27" (28.5" max cutout)', "Tall"],
  ["DOC309627", 1240.25, 'Double Oven Cabinet 30x96x27" (28.5" max cutout)', "Tall"],
  ["DOC338427", 1350.25, 'Double Oven Cabinet 33x84x27" (29.5" max cutout)', "Tall"],
  ["DOC339027", 1361.25, 'Double Oven Cabinet 33x90x27" (29.5" max cutout)', "Tall"],
  ["DOC339627", 1372.25, 'Double Oven Cabinet 33x96x27" (29.5" max cutout)', "Tall"],

  // ── Vanity - 34.5" tall, 21" deep ──
  ["VBD09", 457.63, 'Vanity Base Drawer 9"', "Vanity"],
  ["VBD12", 482.63, 'Vanity Base Drawer 12"', "Vanity"],
  ["VBD15", 506.00, 'Vanity Base Drawer 15"', "Vanity"],
  ["VBD18", 536.25, 'Vanity Base Drawer 18"', "Vanity"],
  ["VBD21", 577.50, 'Vanity Base Drawer 21"', "Vanity"],
  ["VBD24", 613.25, 'Vanity Base Drawer 24"', "Vanity"],
  // ── Vanity Sink Base - 2 door, 1 dummy drawer ──
  ["VSB24", 453.75, 'Vanity Sink Base 24"', "Vanity"],
  ["VSB27", 496.38, 'Vanity Sink Base 27"', "Vanity"],
  ["VSB30", 534.88, 'Vanity Sink Base 30"', "Vanity"],
  ["VSB36", 573.75, 'Vanity Sink Base 36"', "Vanity"],
  ["VSB60", 1068.00, 'Vanity Sink Base 60" (White Shaker only)', "Vanity"],
  // ── Combo Vanity ──
  ["VSD30R", 646.25, 'Combo Vanity 30" - 1 Door 2 Drawer, Door Right', "Vanity"],
  ["VSD30L", 646.25, 'Combo Vanity 30" - 1 Door 2 Drawer, Door Left', "Vanity"],
  ["VSD36R", 771.38, 'Combo Vanity 36" - 2 Door 2 Drawer, Door Right', "Vanity"],
  ["VSD36L", 771.38, 'Combo Vanity 36" - 2 Door 2 Drawer, Door Left', "Vanity"],
  // ── Bath Cabinets ──
  ["DV1245", 515.63, 'Bath Counter Cabinet 12x45" - 2 Drawer 1 Door', "Vanity"],

  // ── Fillers ──
  ["BF3", 50.88, 'Base Filler 3"', "Filler"],
  ["BF6", 83.88, 'Base Filler 6"', "Filler"],
  ["WF330", 35.75, 'Wall Filler 3x30"', "Filler"],
  ["WF336", 39.88, 'Wall Filler 3x36"', "Filler"],
  ["WF342", 67.38, 'Wall Filler 3x42"', "Filler"],
  ["WF630", 66.00, 'Wall Filler 6x30"', "Filler"],
  ["WF636", 71.50, 'Wall Filler 6x36"', "Filler"],
  ["WF642", 88.00, 'Wall Filler 6x42"', "Filler"],
  ["CM343", 103.13, 'Tall Filler 3x3/4x96"', "Filler"],
  ["CM346", 203.50, 'Tall Filler 6x3/4x96"', "Filler"],

  // ── Panels / dummy doors ──
  ["DWR", 132.00, "Dishwasher Return Panel (Finished Inside and Out)", "Panel"],
  ["REP8427", 257.13, 'Fridge End Panel 84x27"', "Panel"],
  ["REP9027", 302.50, 'Fridge End Panel 90x27"', "Panel"],
  ["REP9627", 330.00, 'Fridge End Panel 96x27"', "Panel"],
  ["PNL8427", 257.13, 'Finished End Panel 84x27" - 3/4"', "Panel"],
  ["PNL9027", 302.50, 'Finished End Panel 90x27" - 3/4"', "Panel"],
  ["PNL9627", 330.00, 'Finished End Panel 96x27" - 3/4"', "Panel"],
  ["BP9636", 217.25, 'Base Skin Panel 96x36" (Long Grain)', "Panel"],
  ["BDD21", 269.50, 'Vanity End Dummy Door 21"', "Panel"],
  ["BDD24", 233.75, 'Base End Dummy Door 24"', "Panel"],
  ["BDD8427", 690.00, 'Pantry End Dummy Door Pair 84"', "Panel"],
  ["BDD9027", 720.00, 'Pantry End Dummy Door Pair 90"', "Panel"],
  ["BDD9627", 750.00, 'Pantry End Dummy Door Pair 96"', "Panel"],
  ["W1230F", 115.50, 'Wall Dummy Door 12x30"', "Panel"],
  ["W1236F", 132.00, 'Wall Dummy Door 12x36"', "Panel"],
  ["W1242F", 148.50, 'Wall Dummy Door 12x42"', "Panel"],

  // ── Molding / trim / posts / valance ──
  ["TK", 49.50, 'Toe Kick 96x4.5x.25"', "Molding"],
  ["BM10", 206.25, 'Base Molding 4x.75"', "Molding"],
  ["ACM10", 213.13, "Crown Molding w/Base - Pearl", "Molding"],
  ["AST103", 264.00, "Cove Molding w/Base - Shaker", "Molding"],
  ["AST105", 394.63, "Cove Molding w/Base - Shaker Large", "Molding"],
  ["OCM8", 67.38, "Outside Corner Molding", "Molding"],
  ["SM8", 50.88, "Scribe Molding - 1 End Curved", "Molding"],
  ["TLR8", 177.38, 'Light Rail Molding 1.5x2.25"', "Molding"],
  ["QRM8", 130.63, "Quarter Round Molding", "Molding"],
  ["CCM3", 185.00, "Crown Molding (White Shaker only)", "Molding"],
  ["SP334", 236.50, "Turned Post", "Molding"],
  ["VB30", 83.88, 'Arched Valance 30"', "Molding"],
  ["VB33", 92.13, 'Arched Valance 33"', "Molding"],
  ["VB36", 101.75, 'Arched Valance 36"', "Molding"],
  ["VB42", 121.00, 'Arched Valance 42"', "Molding"],
  ["VB48", 138.88, 'Arched Valance 48"', "Molding"],
  ["VB54", 163.63, 'Arched Valance 54"', "Molding"],
  ["VB60", 180.13, 'Arched Valance 60"', "Molding"],
  ["RPV36", 822.25, 'Raised Panel Arched Valance 36"', "Molding"],
  ["RPV42", 959.75, 'Raised Panel Arched Valance 42"', "Molding"],
  ["RPV48", 1097.25, 'Raised Panel Arched Valance 48"', "Molding"],
  ["RPV54", 1372.25, 'Raised Panel Arched Valance 54"', "Molding"],
  ["RPV60", 1647.25, 'Raised Panel Arched Valance 60"', "Molding"],
  ["RPV72", 1922.25, 'Raised Panel Arched Valance 72"', "Molding"],

  // ── Roll Tray (ball bearing glide) / drawer glides ──
  ["RD15", 121.00, 'Roll-Out Tray 15"', "Accessory"],
  ["RD18", 130.63, 'Roll-Out Tray 18"', "Accessory"],
  ["RD21", 141.63, 'Roll-Out Tray 21"', "Accessory"],
  ["RD24", 154.00, 'Roll-Out Tray 24"', "Accessory"],
  ["RD27", 166.38, 'Roll-Out Tray 27"', "Accessory"],
  ["RD30", 177.38, 'Roll-Out Tray 30"', "Accessory"],
  ["RD33", 189.75, 'Roll-Out Tray 33"', "Accessory"],
  ["RD36", 202.13, 'Roll-Out Tray 36"', "Accessory"],
  ["GLIDE21", 61.25, 'Drawer Glide Set 21"', "Accessory"],
  ["GLIDE18", 52.50, 'Drawer Glide Set 18"', "Accessory"],
  ["GLIDE15", 45.00, 'Drawer Glide Set 15"', "Accessory"],
  ["GLIDE12", 45.00, 'Drawer Glide Set 12"', "Accessory"],

  // ── Shelves / glass door panels ──
  ["SHELF", 41.25, "Extra Wood Shelf", "Accessory"],
  ["W12GS", 80.00, 'Glass Shelf 12" (1 Shelf)', "Accessory"],
  ["W15GS", 100.00, 'Glass Shelf 15"', "Accessory"],
  ["W18GS", 120.00, 'Glass Shelf 18"', "Accessory"],
  ["W21GS", 140.00, 'Glass Shelf 21"', "Accessory"],
  ["W24GS", 160.00, 'Glass Shelf 24"', "Accessory"],
  ["W27GS", 180.00, 'Glass Shelf 27"', "Accessory"],
  ["W30GS", 200.00, 'Glass Shelf 30"', "Accessory"],
  ["W33GS", 220.00, 'Glass Shelf 33"', "Accessory"],
  ["W36GS", 240.00, 'Glass Shelf 36"', "Accessory"],
  ["WDC24S", 320.00, 'Glass Shelf - Diagonal 24"', "Accessory"],
  ["WDC27S", 405.00, 'Glass Shelf - Diagonal 27"', "Accessory"],
  ["W1230G", 87.50, 'Glass Door Panel 12x30"', "Accessory"],
  ["W1530G", 109.38, 'Glass Door Panel 15x30"', "Accessory"],
  ["W1830G", 131.25, 'Glass Door Panel 18x30"', "Accessory"],
  ["W2130G", 153.13, 'Glass Door Panel 21x30"', "Accessory"],
  ["W2730G", 196.88, 'Glass Door Panel 27x30" (Pair)', "Accessory"],
  ["W3330G", 240.63, 'Glass Door Panel 33x30" (Pair)', "Accessory"],
  ["W1236G", 105.63, 'Glass Door Panel 12x36"', "Accessory"],
  ["W1536G", 131.25, 'Glass Door Panel 15x36"', "Accessory"],
  ["W1836G", 157.50, 'Glass Door Panel 18x36"', "Accessory"],
  ["W2136G", 183.75, 'Glass Door Panel 21x36"', "Accessory"],
  ["W2736G", 236.25, 'Glass Door Panel 27x36" (Pair)', "Accessory"],
  ["W3336G", 288.75, 'Glass Door Panel 33x36" (Pair)', "Accessory"],
  ["W1242G", 122.50, 'Glass Door Panel 12x42"', "Accessory"],
  ["W1542G", 153.13, 'Glass Door Panel 15x42"', "Accessory"],
  ["W1842G", 183.75, 'Glass Door Panel 18x42"', "Accessory"],
  ["W2142G", 214.38, 'Glass Door Panel 21x42"', "Accessory"],
  ["W2742G", 275.63, 'Glass Door Panel 27x42" (Pair)', "Accessory"],
  ["W3342G", 336.88, 'Glass Door Panel 33x42" (Pair)', "Accessory"],
  ["WDC2430G", 109.38, 'Glass Door Panel - Diagonal 24x30"', "Accessory"],
  ["WDC2436G", 131.25, 'Glass Door Panel - Diagonal 24x36"', "Accessory"],
  ["WDC2442G", 153.13, 'Glass Door Panel - Diagonal 24x42"', "Accessory"],
  ["WDC273615G", 131.25, 'Glass Door Panel - Diagonal 27x36x15"', "Accessory"],
  ["WDC274215G", 153.13, 'Glass Door Panel - Diagonal 27x42x15"', "Accessory"],
  // ── Floating Shelf - 10"D, 2.5"H, White Shaker / Super White / Natural Wood only ──
  ["FS24", 104.30, 'Floating Shelf 24"', "Accessory"],
  ["FS30", 114.20, 'Floating Shelf 30"', "Accessory"],
  ["FS36", 123.30, 'Floating Shelf 36"', "Accessory"],
  ["FS42", 131.40, 'Floating Shelf 42"', "Accessory"],
  ["FS48", 146.80, 'Floating Shelf 48"', "Accessory"],
  ["FS54", 166.95, 'Floating Shelf 54"', "Accessory"],
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
  ...CABINET_DEFS.map(([sku, price, name, subcategory], i): MockProduct => ({
    id: `prod-${sku}`,
    sku,
    name,
    category: "CABINETS",
    subcategory,
    unit: "EACH",
    unitsPerBox: null,
    supportsAssembly: true,
    sortOrder: i,
    price,
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
    price: null, // not on the cabinet price sheet
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

export type MockRole = Role;

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  accountId: string | null;
}

export const MOCK_ACCOUNT = {
  id: "acct-demo-001",
  name: "Meridian Builders LLC",
  accountNumber: "CG-001",
};

export interface MockShipTo {
  id: string;
  accountId: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  contactName?: string | null;
  contactPhone?: string | null;
  isDefault: boolean;
}

export const MOCK_SHIP_TO: MockShipTo[] = [
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
    email: "jordan@meridianbuilders.com",
    fullName: "Jordan Ellis",
    role: "CUSTOMER_ADMIN",
    accountId: MOCK_ACCOUNT.id,
  },
  {
    id: "user-staff",
    email: "staff@cgglobal.com",
    fullName: "C&G Staff",
    role: "STAFF_ADMIN",
    accountId: null,
  },
];

export function findUserById(id: string): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
