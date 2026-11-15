export function findMatchingVariant(variants, options) {
  if (!variants) return null;
  return variants.find((variant) =>
    variant.attributes.every((attr) =>
      Number(options[attr.code]) === Number(attr.value_index)
    )
  ) || null;
}

export const isSwatchable = (option) =>
  option.values?.some((v) => v.swatch_data?.value && String(v.swatch_data.value).startsWith('#'));

// Label of the currently-selected value for a given option (or '').
export const selectedLabel = (option, selectedOptions) =>
  option.values.find(
    (v) => Number(v.value_index) === Number(selectedOptions[option.attribute_code])
  )?.label || '';

export const isValueInStock = (variants, selectedOptions, attributeCode, valueIndex) =>
  (variants || []).some((variant) =>
    variant.product?.stock_status === 'IN_STOCK'
    && variant.attributes.every((attr) => {
      if (attr.code === attributeCode) return Number(attr.value_index) === Number(valueIndex);
      const chosen = selectedOptions[attr.code];
      return chosen == null || Number(attr.value_index) === Number(chosen);
    }));
