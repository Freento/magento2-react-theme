export const validateEmail = (v) => {
    const value = (v || '').trim();
    if (!value) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return null;
};

const DEFAULT_OPTIONAL_ZIP_COUNTRIES = new Set([
    'AE', 'AG', 'AN', 'AO', 'AW', 'BF', 'BI', 'BJ', 'BO', 'BS', 'BW', 'BZ',
    'CD', 'CF', 'CG', 'CI', 'CK', 'CM', 'DJ', 'DM', 'ER', 'FJ', 'GD', 'GH',
    'GM', 'GN', 'GQ', 'GY', 'HK', 'IE', 'JM', 'KE', 'KI', 'KM', 'KN', 'KP',
    'LC', 'ML', 'MO', 'MR', 'MS', 'MU', 'MW', 'NR', 'NU', 'PA', 'QA', 'RW',
    'SB', 'SC', 'SD', 'SL', 'SO', 'SR', 'ST', 'SY', 'TG', 'TL', 'TO', 'TV',
    'TZ', 'UG', 'VU', 'YE', 'ZW',
]);

const POSTCODE_PATTERNS = {
    US: /^\d{5}(-\d{4})?$/,
    CA: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i,
    GB: /^GIR ?0AA$|^[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2}$/i,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    IT: /^\d{5}$/,
    ES: /^\d{5}$/,
    NL: /^\d{4} ?[A-Z]{2}$/i,
    BE: /^\d{4}$/,
    PL: /^\d{2}-\d{3}$/,
    SE: /^\d{3} ?\d{2}$/,
    NO: /^\d{4}$/,
    FI: /^\d{5}$/,
    DK: /^\d{4}$/,
    CH: /^\d{4}$/,
    AT: /^\d{4}$/,
    PT: /^\d{4}(-\d{3})?$/,
    IE: /^[A-Z]\d{2} ?[A-Z0-9]{4}$/i,
    RU: /^\d{6}$/,
    BY: /^\d{6}$/,
    UA: /^\d{5}$/,
    KZ: /^\d{6}$/,
    JP: /^\d{3}-?\d{4}$/,
    CN: /^\d{6}$/,
    KR: /^\d{5}$/,
    IN: /^\d{6}$/,
    AU: /^\d{4}$/,
    NZ: /^\d{4}$/,
    BR: /^\d{5}-?\d{3}$/,
    MX: /^\d{5}$/,
    AR: /^[A-Z]?\d{4}[A-Z]{0,3}$/i,
    IL: /^\d{5}(\d{2})?$/,
    TR: /^\d{5}$/,
    ZA: /^\d{4}$/,
    BD: /^\d{4}$/,
    BG: /^\d{4}$/,
    CZ: /^\d{3} ?\d{2}$/,
    EE: /^\d{5}$/,
    GR: /^\d{3} ?\d{2}$/,
    HU: /^\d{4}$/,
    IS: /^\d{3}$/,
    ID: /^\d{5}$/,
    LT: /^(LT-)?\d{5}$/,
    LV: /^(LV-)?\d{4}$/,
    MD: /^\d{4}$/,
    MY: /^\d{5}$/,
    NG: /^\d{6}$/,
    PH: /^\d{4}$/,
    PK: /^\d{5}$/,
    RO: /^\d{6}$/,
    RS: /^\d{5,6}$/,
    SA: /^\d{5}$/,
    SG: /^\d{6}$/,
    SI: /^(SI-)?\d{4}$/,
    SK: /^\d{3} ?\d{2}$/,
    TH: /^\d{5}$/,
    TW: /^\d{3}(\d{2,3})?$/,
    VN: /^\d{6}$/,
};

const POSTCODE_FALLBACK = /^[A-Z0-9][A-Z0-9 -]{2,9}$/i;

export const isOptionalZipCountry = (countryCode, optionalList) => {
    const cc = (countryCode || '').toUpperCase();
    if (!cc) return false;
    if (Array.isArray(optionalList) && optionalList.length > 0) {
        return optionalList.map((c) => String(c).toUpperCase()).includes(cc);
    }
    return DEFAULT_OPTIONAL_ZIP_COUNTRIES.has(cc);
};

export function validateAddressField(field, value, ctx = {}) {
    const v = typeof value === 'string' ? value : (value ?? '');
    const str = typeof v === 'string' ? v : String(v);
    switch (field) {
        case 'firstname':
            return str.trim() ? null : 'First name is required';
        case 'lastname':
            return str.trim() ? null : 'Last name is required';
        case 'street':
            return str.trim() ? null : 'Street address is required';
        case 'city':
            return str.trim() ? null : 'City is required';
        case 'region': {
            const hasRegions = (ctx.availableRegions || []).length > 0;
            if (hasRegions) {
                return ctx.regionId ? null : 'State / region is required';
            }
            return str.trim() ? null : 'State / region is required';
        }
        case 'postcode':
            return validatePostcode(str, ctx.countryCode, ctx.optionalZipCountries);
        case 'telephone':
            return validatePhone(str);
        case 'country':
            return str ? null : 'Country is required';
        default:
            return null;
    }
}

export function validateAddressAll(value, ctx = {}) {
    const errs = {};
    const fields = ['firstname', 'lastname', 'street', 'city', 'region', 'postcode', 'country', 'telephone'];
    for (const f of fields) {
        const v = f === 'street' ? (value?.street?.[0] || '')
                : f === 'country' ? value?.country_code
                : value?.[f];
        const err = validateAddressField(f, v, { ...ctx, regionId: value?.region_id, countryCode: value?.country_code });
        if (err) errs[f] = err;
    }
    return errs;
}

export const validatePostcode = (v, countryCode, optionalList) => {
    const value = (v || '').trim();
    const optional = isOptionalZipCountry(countryCode, optionalList);
    if (!value) return optional ? null : 'ZIP / postal code is required';
    const cc = (countryCode || '').toUpperCase();
    const pattern = POSTCODE_PATTERNS[cc] || POSTCODE_FALLBACK;
    if (!pattern.test(value)) return 'Invalid postal code format';
    return null;
};

export const validatePhone = (v) => {
    const value = (v || '').trim();
    if (!value) return 'Phone number is required';
    if (!/^\d{10,}$/.test(value)) return 'Phone number must be at least 10 digits';
    return null;
};

export const validateAddress = (shippingAddress, email, billingAddress, useSameAsShipping, optionalZipCountries) => {
    const newErrors = {};

    if (!email.trim()) {
        newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = 'Invalid email format';
    }

    if (!shippingAddress.firstname.trim()) {
        newErrors.firstname = 'First name is required';
    }

    if (!shippingAddress.lastname.trim()) {
        newErrors.lastname = 'Last name is required';
    }

    if (!shippingAddress.street[0]?.trim()) {
        newErrors.street = 'Street address is required';
    }

    if (!shippingAddress.city.trim()) {
        newErrors.city = 'City is required';
    }

    if (!shippingAddress.region_id && !(shippingAddress.region || '').trim()) {
        newErrors.region = 'State / region is required';
    }

    const postcodeErr = validatePostcode(shippingAddress.postcode, shippingAddress.country_code, optionalZipCountries);
    if (postcodeErr) newErrors.postcode = postcodeErr;

    if (!shippingAddress.telephone.trim()) {
        newErrors.telephone = 'Phone number is required';
    } else if (!/^\d{10,}$/.test(shippingAddress.telephone.trim())) {
        newErrors.telephone = 'Phone number must be at least 10 digits';
    }

    // Validate billing address if not using same as shipping
    if (!useSameAsShipping && billingAddress) {
        if (!billingAddress.firstname.trim()) {
            newErrors.billing_firstname = 'Billing first name is required';
        }

        if (!billingAddress.lastname.trim()) {
            newErrors.billing_lastname = 'Billing last name is required';
        }

        if (!billingAddress.street[0]?.trim()) {
            newErrors.billing_street = 'Billing street address is required';
        }

        if (!billingAddress.city.trim()) {
            newErrors.billing_city = 'Billing city is required';
        }

        if (!billingAddress.region_id && !(billingAddress.region || '').trim()) {
            newErrors.billing_region = 'Billing state / region is required';
        }

        const billPostcodeErr = validatePostcode(billingAddress.postcode, billingAddress.country_code, optionalZipCountries);
        if (billPostcodeErr) newErrors.billing_postcode = billPostcodeErr.replace(/^/, 'Billing ');

        if (!billingAddress.telephone.trim()) {
            newErrors.billing_telephone = 'Billing phone number is required';
        } else if (!/^\d{10,}$/.test(billingAddress.telephone.trim())) {
            newErrors.billing_telephone = 'Billing phone number must be at least 10 digits';
        }
    }

    return newErrors;
};
