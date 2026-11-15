export const customOptionLines = (item) => (item?.customizable_options || [])
  .map((opt) => ({
    uid: opt.customizable_option_uid,
    label: opt.label,
    value: (opt.values || []).map((v) => v.label || v.value).filter(Boolean).join(', '),
  }))
  .filter((line) => line.value);
