import { z } from "zod";

/**
 * Catalog editing from the Admin Portal: products and colors. Everything a
 * staff member can change about what customers see and order.
 */

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalNumber = z.number().min(0, "Can't be negative.").nullable().optional();

const productFields = {
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required.")
    .max(60)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores."),
  name: z.string().trim().min(1, "Name is required.").max(160),
  description: optionalText(600),
  category: z.enum(["CABINETS", "FLOORING"]),
  subcategory: optionalText(60),
  unit: z.enum(["EACH", "BOX"]),
  unitsPerBox: optionalNumber,
  price: optionalNumber,
  supportsAssembly: z.boolean(),
  imageUrl: optionalText(500),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
  maxQuantity: z.number().int().min(1, "Must be at least 1.").max(100000),
  /** Colors this product can be ordered in. */
  colorIds: z.array(z.string().uuid()).default([]),
  /** Optional "Thickness"-style choices, one value per line in the form. */
  optionName: optionalText(60),
  optionValues: z.array(z.string().trim().min(1)).default([]),
};

export const createProductSchema = z.object(productFields);
export type CreateProductInput = z.input<typeof createProductSchema>;

export const updateProductSchema = z.object({ id: z.string().uuid(), ...productFields });
export type UpdateProductInput = z.input<typeof updateProductSchema>;

const colorFields = {
  name: z.string().trim().min(1, "Name is required.").max(80),
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .max(40)
    .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores."),
  swatchUrl: optionalText(500),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(0).max(100000),
};

export const createColorSchema = z.object(colorFields);
export type CreateColorInput = z.input<typeof createColorSchema>;

export const updateColorSchema = z.object({ id: z.string().uuid(), ...colorFields });
export type UpdateColorInput = z.input<typeof updateColorSchema>;
