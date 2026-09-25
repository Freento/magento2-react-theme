import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_COUNTRIES, SET_SHIPPING_METHOD } from '../../queries/checkout';
import { GET_CUSTOMER_DATA } from '../../queries/customer';
import { ESTIMATE_SHIPPING_METHODS } from '../../queries/cart/estimateShippingMethods';
import { useAuth } from '../../context/AuthContext';
import { formatMoney as fmt } from '../../lib/money';
import { validateZip } from '../../lib/zipValidation';
import ChevronDownIcon from '../ui/icons/ChevronDownIcon';

const keyOf = (m) => (m ? `${m.carrier_code}|${m.method_code}` : '');
const DEFAULT_COUNTRY = 'US';

export default function CartShippingEstimate({ cartId, cartData }) {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const addr = cartData?.shipping_addresses?.[0];
  const selected = addr?.selected_shipping_method;

  const [country, setCountry] = useState(addr?.country?.code || DEFAULT_COUNTRY);
  const [regionId, setRegionId] = useState(addr?.region?.region_id ? String(addr.region.region_id) : '');
  const [regionText, setRegionText] = useState('');
  const [zip, setZip] = useState(addr?.postcode && addr.postcode !== '00000' ? addr.postcode : '');
  const [methods, setMethods] = useState([]);
  const [hasEstimated, setHasEstimated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const touched = useRef(false);

  const { data: countriesData } = useQuery(GET_COUNTRIES, { fetchPolicy: 'cache-first' });
  const countries = useMemo(
    () => [...(countriesData?.countries || [])].sort(
      (a, b) => (a.full_name_locale || '').localeCompare(b.full_name_locale || '')
    ),
    [countriesData]
  );
  const { data: custData } = useQuery(GET_CUSTOMER_DATA, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (touched.current || addr?.country?.code) return;
    const list = custData?.customer?.addresses || [];
    const def = list.find((a) => a.default_shipping) || list[0];
    if (!def) return;
    setCountry(def.country_code || DEFAULT_COUNTRY);
    setRegionId(def.region?.region_id ? String(def.region.region_id) : '');
    setZip(def.postcode || '');
  }, [custData, addr]);

  const regions = useMemo(
    () => countries.find((c) => c.two_letter_abbreviation === country)?.available_regions || [],
    [countries, country],
  );

  const [estimateShipping] = useMutation(ESTIMATE_SHIPPING_METHODS);
  const [setShippingMethod] = useMutation(SET_SHIPPING_METHOD);

  const buildAddress = () => {
    const region = regions.find((r) => String(r.id) === regionId);
    return {
      firstname: '-',
      lastname: '-',
      street: ['-'],
      city: '-',
      telephone: '-',
      country_code: country,
      postcode: zip.trim() || '00000',
      ...(region ? { region_id: Number(region.id) } : {}),
      ...(!region && regionText.trim() ? { region: regionText.trim() } : {}),
    };
  };
  const buildAddressRef = useRef(buildAddress);
  buildAddressRef.current = buildAddress;

  const debounce = useRef(null);
  useEffect(() => {
    if (!open || !cartId || !country) return undefined;
    if (regions.length > 0 && !regionId) {
      setRegionId(String(regions[0].id));
      return undefined;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const res = await estimateShipping({
          variables: { cartId, address: buildAddressRef.current() },
        });
        const cart = res?.data?.setShippingAddressesOnCart?.cart;
        const list = (cart?.shipping_addresses?.[0]?.available_shipping_methods || [])
          .filter((m) => m.available !== false);
        setMethods(list);
        setHasEstimated(true);
      } catch (err) {
        setError(err?.graphQLErrors?.[0]?.message || err?.message || 'Could not estimate shipping.');
        setMethods([]);
      } finally {
        setBusy(false);
      }
    }, 500);
    return () => debounce.current && clearTimeout(debounce.current);
  }, [open, cartId, country, regionId, regionText, zip, regions, estimateShipping]);

  const selectMethod = async (m) => {
    setBusy(true);
    setError('');
    try {
      await setShippingMethod({
        variables: { cartId, carrierCode: m.carrier_code, methodCode: m.method_code },
      });
    } catch (err) {
      setError(err?.graphQLErrors?.[0]?.message || err?.message || 'Could not set the shipping method.');
    } finally {
      setBusy(false);
    }
  };

  const zipCheck = validateZip(country, zip);

  const groups = useMemo(() => {
    const byCarrier = new Map();
    for (const m of methods) {
      const t = m.carrier_title || 'Shipping';
      if (!byCarrier.has(t)) byCarrier.set(t, []);
      byCarrier.get(t).push(m);
    }
    return [...byCarrier.entries()];
  }, [methods]);

  const onCountry = (v) => { touched.current = true; setCountry(v); setRegionId(''); setRegionText(''); };
  const onRegionId = (v) => { touched.current = true; setRegionId(v); };
  const onRegionText = (v) => { touched.current = true; setRegionText(v); };
  const onZip = (v) => { touched.current = true; setZip(v); };

  const fieldCls = 'cart-field mb-2.5';
  const fieldLabelCls = 'block mb-1 text-xs font-medium text-ink-2';
  const fieldInputCls = 'w-full h-[38px] px-2.5 py-0 border border-line rounded bg-bg font-sans text-sm text-ink focus:outline-none focus:border-ink';
  const hintCls = 'cart-estimate-hint mb-3 text-sm text-ink-2';

  return (
    <div className="cart-estimate mb-1 border-b border-line">
      <button
        type="button"
        className="cart-estimate-toggle flex items-center justify-between gap-2.5 w-full pb-3.5 border-0 text-base font-medium text-ink"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Estimate Shipping and Tax</span>
        <ChevronDownIcon className={`[transition:transform_120ms_ease]${open ? ' rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="cart-estimate-body pb-4">
          <p className={hintCls}>Enter your destination to get a shipping estimate.</p>

          <div className={fieldCls}>
            <label className={fieldLabelCls} htmlFor="est-country">Country</label>
            <select className={fieldInputCls} id="est-country" value={country} onChange={(e) => onCountry(e.target.value)}>
              {countries.map((c) => (
                <option key={c.two_letter_abbreviation} value={c.two_letter_abbreviation}>
                  {c.full_name_locale}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldCls}>
            <label className={fieldLabelCls} htmlFor="est-region">State/Province</label>
            {regions.length > 0 ? (
              <select className={fieldInputCls} id="est-region" value={regionId} onChange={(e) => onRegionId(e.target.value)}>
                <option value="">Please select a region, state or province.</option>
                {regions.map((r) => (
                  <option key={r.id} value={String(r.id)}>{r.name}</option>
                ))}
              </select>
            ) : (
              <input
                id="est-region"
                type="text"
                className={fieldInputCls}
                value={regionText}
                onChange={(e) => onRegionText(e.target.value)}
                placeholder="State/Province"
              />
            )}
          </div>

          <div className={fieldCls}>
            <label className={fieldLabelCls} htmlFor="est-zip">Zip/Postal Code</label>
            <input
              id="est-zip"
              type="text"
              className={fieldInputCls}
              value={zip}
              onChange={(e) => onZip(e.target.value)}
              autoComplete="postal-code"
            />
            {!zipCheck.valid && (
              <p className="cart-estimate-warning mt-2 px-3.5 py-2.5 bg-[#fdf0d5] rounded text-xs leading-base text-[#6f4400]" role="status">
                Provided Zip/Postal Code seems to be invalid.
                {' '}Example: {zipCheck.example}.
                {' '}If you believe it is the right one you can ignore this notice.
              </p>
            )}
          </div>

          {error && <p className="cart-estimate-error my-2 text-sm text-danger" role="alert">{error}</p>}

          {busy && methods.length === 0 ? (
            <div className="cart-estimate-loading py-2 text-sm text-ink-2" aria-live="polite">Estimating…</div>
          ) : !hasEstimated ? null : methods.length === 0 ? (
            <p className={hintCls}>No shipping methods available for this destination.</p>
          ) : (
            groups.map(([carrier, ms]) => (
              <div key={carrier} className="cart-estimate-group mt-2.5">
                <h4 className="cart-estimate-group-title mb-1 text-sm font-semibold text-ink">{carrier}</h4>
                {ms.map((m) => {
                  const k = keyOf(m);
                  return (
                    <label key={k} className="cart-estimate-option flex items-center gap-2 py-[5px] text-sm text-ink cursor-pointer">
                      <input
                        type="radio"
                        name="cart-ship-method"
                        className="accent-ink"
                        checked={keyOf(selected) === k}
                        disabled={busy}
                        onChange={() => selectMethod(m)}
                      />
                      <span className="cart-estimate-option-title">{m.method_title || m.carrier_title}</span>
                      <span className="cart-estimate-option-price ml-auto tabular-nums">{fmt(m.amount?.value, m.amount?.currency)}</span>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
