import { useState, useCallback } from 'react';
import {
  validateAddressField,
  validateAddressAll,
} from '../components/checkout/validation/addressValidation';

export default function useAddressValidation(address, ctx = {}) {
  const [touched, setTouched] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  const externalErrors = ctx.externalErrors || {};
  const errors = {};
  for (const k of new Set([...Object.keys(externalErrors), ...Object.keys(localErrors)])) {
    const local = localErrors[k];
    if (local === null) continue;
    if (local !== undefined) errors[k] = local;
    else errors[k] = externalErrors[k];
  }

  const setLocal = useCallback((k, v) => {
    setLocalErrors((prev) => ({ ...prev, [k]: v }));
  }, []);

  const ctxFor = (form) => ({
    availableRegions: ctx.availableRegions,
    optionalZipCountries: ctx.optionalZipCountries,
    countryCode: (form || address)?.country_code,
    regionId: (form || address)?.region_id,
  });

  const readField = (form, field) => {
    if (field === 'street') return form?.street?.[0] || '';
    if (field === 'country') return form?.country_code;
    if (field === 'region') return (ctx.availableRegions || []).length > 0 ? form?.region_id : form?.region;
    return form?.[field];
  };

  const onBlur = useCallback((field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setLocal(field, validateAddressField(field, readField(address, field), ctxFor()));
  }, [address, ctx.availableRegions, ctx.optionalZipCountries]);

  const onLiveChange = useCallback((field, value, nextForm) => {
    const errKey = field === 'country_code' ? 'country' : field;
    if (!errors[errKey]) return;
    const v = field === 'street' ? (value?.[0] || '') : value;
    const err = validateAddressField(errKey, v, ctxFor(nextForm));
    if (!err) setLocal(errKey, null);
  }, [errors, address, ctx.availableRegions, ctx.optionalZipCountries]);

  const onCountryChange = useCallback((nextCountry, nextForm) => {
    if (!touched.postcode && !errors.postcode) return;
    const err = validateAddressField('postcode', nextForm?.postcode ?? address?.postcode, {
      ...ctxFor(nextForm),
      countryCode: nextCountry,
    });
    setLocal('postcode', err);
  }, [touched.postcode, errors.postcode, address, ctx.availableRegions, ctx.optionalZipCountries]);

  const validateAll = useCallback(() => {
    const errs = validateAddressAll(address, ctxFor());
    setLocalErrors(errs);
    setTouched((p) => ({ ...p, ...Object.fromEntries(Object.keys(errs).map((k) => [k, true])) }));
    return errs;
  }, [address, ctx.availableRegions, ctx.optionalZipCountries]);

  const reset = useCallback(() => {
    setTouched({});
    setLocalErrors({});
  }, []);

  return { errors, touched, onBlur, onLiveChange, onCountryChange, validateAll, reset };
}
