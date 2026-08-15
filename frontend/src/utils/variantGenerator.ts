/**
 * Utility functions for generating and managing product variants
 */

export interface VariantTemplate {
  name: string;
  values: string[];
}

export interface VariantType {
  name: string;
  type: "swatch" | "button" | "dropdown";
  values: Array<{
    label: string;
    value: string;
    hex?: string;
  }>;
}

export interface VariantCombination {
  sku: string;
  name: string;
  attributeValues: Record<string, string>;
  images: string[];
  thumbnail: string;
  price: number;
  originalPrice?: number;
  stock: number;
  moq: number;
  specifications: Array<{ label: string; value: string }>;
  available: boolean;
  badge?: string;
}

/**
 * Convert simple variant templates to proper variantTypes structure
 */
export function transformTemplateToVariantType(
  template: VariantTemplate
): VariantType {
  return {
    name: template.name,
    type: "dropdown", // Default to dropdown for auto-generated
    values: template.values.map((value) => ({
      label: value,
      value: value.toLowerCase().replace(/\s+/g, "-"),
      hex: undefined,
    })),
  };
}

/**
 * Generate all possible variant combinations from templates
 * Example: Color (Red, Blue) × Size (S, M) = 4 combinations
 * Stock is distributed equally among all variants
 */
export function generateVariantCombinations(
  templates: VariantTemplate[],
  basePrice: number = 0,
  baseSku: string = "",
  baseStock: number = 0
): VariantCombination[] {
  if (!templates.length) return [];

  const combinations: VariantCombination[] = [];
  let variantIndex = 0;

  // Calculate total combinations first for stock distribution
  const totalCombos = getVariantCombinationCount(templates);
  const stockPerVariant = totalCombos > 0 ? Math.floor(baseStock / totalCombos) : 0;

  // Recursive function to generate all combinations
  const generateCombos = (
    index: number,
    current: Record<string, string>
  ) => {
    if (index === templates.length) {
      variantIndex++;
      // Generate SKU from attributes
      const skuSuffix = Object.values(current)
        .map((v) => v.replace(/\s+/g, "").substring(0, 3).toUpperCase())
        .join("-");

      const variantName = Object.values(current).join(" - ");

      combinations.push({
        sku: baseSku ? `${baseSku}-${skuSuffix}` : skuSuffix,
        name: variantName,
        attributeValues: { ...current },
        images: [],
        thumbnail: "",
        price: basePrice,
        originalPrice: basePrice,
        stock: stockPerVariant,
        moq: 1,
        specifications: [],
        available: stockPerVariant > 0,
      });
      return;
    }

    const template = templates[index];
    for (const value of template.values) {
      current[template.name] = value;
      generateCombos(index + 1, current);
    }
  };

  generateCombos(0, {});
  return combinations;
}

/**
 * Get total number of combinations that will be generated
 */
export function getVariantCombinationCount(
  templates: VariantTemplate[]
): number {
  return templates.reduce((acc, t) => acc * (t.values.length || 0), 1);
}

/**
 * Validate variant templates
 */
export function validateVariantTemplates(
  templates: VariantTemplate[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(templates)) {
    errors.push("Variant templates must be an array");
    return { valid: false, errors };
  }

  templates.forEach((template, idx) => {
    if (!template.name?.trim()) {
      errors.push(`Template ${idx + 1}: Name is required`);
    }

    if (!Array.isArray(template.values) || template.values.length === 0) {
      errors.push(
        `Template ${idx + 1} (${template.name}): Must have at least 1 value`
      );
    }

    if (template.values.some((v) => !v?.trim())) {
      errors.push(
        `Template ${idx + 1} (${template.name}): All values must be non-empty`
      );
    }
  });

  const combinationCount = getVariantCombinationCount(templates);
  if (combinationCount > 5000) {
    errors.push(
      `Too many combinations (${combinationCount}). Maximum is 5000. Reduce variant options.`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format variant attributes for display
 */
export function formatVariantName(
  attributeValues: Record<string, string>
): string {
  return Object.values(attributeValues).join(" - ");
}
