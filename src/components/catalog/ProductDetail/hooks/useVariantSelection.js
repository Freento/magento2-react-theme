import { useState, useEffect, useRef } from 'react';
import { findMatchingVariant, isSwatchable } from '../helpers/productVariants';

export default function useVariantSelection(product, isConfigurable, initialValueUids) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (isConfigurable && product) {
      setSelectedVariant(findMatchingVariant(product.variants, selectedOptions));
    }
  }, [selectedOptions, isConfigurable, product]);

  // Editing a cart line: pre-select the options that line was configured with,
  // once the product (and therefore its option values) has loaded.
  const preselected = useRef(false);
  useEffect(() => {
    if (preselected.current || !isConfigurable) return;
    if (!initialValueUids?.length || !product?.configurable_options?.length) return;
    const preset = {};
    product.configurable_options.forEach((option) => {
      const value = option.values?.find((v) => initialValueUids.includes(v.uid));
      if (value) preset[option.attribute_code] = Number(value.value_index);
    });
    if (!Object.keys(preset).length) return;
    preselected.current = true;
    setSelectedOptions(preset);
  }, [isConfigurable, initialValueUids, product]);

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
