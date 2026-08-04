const isOn = (val) => (val ?? 'on').toString().toLowerCase() !== 'off';

export const FEATURES = {
  topbar:     isOn(import.meta.env.VITE_FEATURE_TOPBAR),
  newsletter: isOn(import.meta.env.VITE_FEATURE_NEWSLETTER),
  wishlist:   isOn(import.meta.env.VITE_FEATURE_WISHLIST),
};
