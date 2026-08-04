import { useState, useEffect } from 'react';
import { findMatchingVariant, isSwatchable } from '../helpers/productVariants';

export default function useVariantSelection(product, isConfigurable) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (isConfigurable && product) {
      setSelectedVariant(findMatchingVariant(product.variants, selectedOptions));
    }
  }, [selectedOptions, isConfigurable, product]);

  const handleOptionChange = (attributeCode, valueIndex) => {
    setSelectedOptions((prev) => {
      if (Number(prev[attributeCode]) === Number(valueIndex)) {
        const { [attributeCode]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [attributeCode]: valueIndex };
    });
  };

  const configOptions = isConfigurable ? (product?.configurable_options || []) : [];
  const swatchOptions = configOptions.filter(isSwatchable);
  const buttonOptions = configOptions.filter((o) => !isSwatchable(o));

  const previewVariant = (() => {
    if (!isConfigurable || !product?.variants) return null;
    if (selectedVariant) return selectedVariant;
    const swatchKeys = swatchOptions.map((o) => o.attribute_code).filter((k) => selectedOptions[k] != null);
    if (!swatchKeys.length) return null;
    return product.variants.find((variant) =>
      variant.attributes
        .filter((attr) => swatchKeys.includes(attr.code))
        .every((attr) => Number(attr.value_index) === Number(selectedOptions[attr.code]))
    ) || null;
  })();

  return {
    selectedOptions,
    selectedVariant,
    handleOptionChange,
    configOptions,
    swatchOptions,
    buttonOptions,
    previewVariant,
  };
}
