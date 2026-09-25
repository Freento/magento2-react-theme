export const selectedOptionUids = (configOptions, selectedOptions) =>
  (configOptions || [])
    .map((option) => option.values?.find(
      (v) => Number(v.value_index) === Number(selectedOptions[option.attribute_code])
    )?.uid)
    .filter(Boolean);
