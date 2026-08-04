import React from 'react';

export default function AddressFormFields({
  value,
  onChange,
  onBlur,
  errors = {},
  countries = [],
  availableRegions = [],
  optionalZipCountries = [],
  idPrefix = 'addr',
  showCountry = true,
  showApartment = false,
}) {
  const v = value || {};
  const street1 = (v.street && v.street[0]) || '';
  const street2 = (v.street && v.street[1]) || '';
  const id = (k) => `${idPrefix}-${k}`;

  const setStreetLine = (idx, val) => {
    const next = [...(v.street || ['', ''])];
    next[idx] = val;
    onChange('street', next);
  };

  return (
    <div className="form-grid">
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label" htmlFor={id('firstname')}>First Name *</label>
          <input
            id={id('firstname')}
            type="text"
            value={v.firstname || ''}
            onChange={(e) => onChange('firstname', e.target.value)}
            onBlur={() => onBlur && onBlur('firstname')}
            placeholder="Enter first name"
            required
            className={`form-input ${errors.firstname ? 'error' : ''}`}
          />
          {errors.firstname && <div className="form-error">{errors.firstname}</div>}
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={id('lastname')}>Last Name *</label>
          <input
            id={id('lastname')}
            type="text"
            value={v.lastname || ''}
            onChange={(e) => onChange('lastname', e.target.value)}
            onBlur={() => onBlur && onBlur('lastname')}
            placeholder="Enter last name"
            required
            className={`form-input ${errors.lastname ? 'error' : ''}`}
          />
          {errors.lastname && <div className="form-error">{errors.lastname}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor={id('street1')}>Street Address *</label>
        <input
          id={id('street1')}
          type="text"
          value={street1}
          onChange={(e) => setStreetLine(0, e.target.value)}
          onBlur={() => onBlur && onBlur('street')}
          placeholder="Enter street address"
          required
          className={`form-input ${errors.street ? 'error' : ''}`}
        />
        {errors.street && <div className="form-error">{errors.street}</div>}
      </div>

      {showApartment && (
        <div className="form-group">
          <label className="form-label" htmlFor={id('street2')}>Apartment, suite, etc.</label>
          <input
            id={id('street2')}
            type="text"
            value={street2}
            onChange={(e) => setStreetLine(1, e.target.value)}
            placeholder="Apartment, suite, etc. (optional)"
            className="form-input"
          />
        </div>
      )}

      {showCountry && (
        <div className="form-group">
          <label className="form-label" htmlFor={id('country')}>Country *</label>
          <select
            id={id('country')}
            value={v.country_code || ''}
            onChange={(e) => onChange('country_code', e.target.value)}
            onBlur={() => onBlur && onBlur('country')}
            required
            className={`form-select ${errors.country ? 'error' : ''}`}
          >
            <option value="">Select Country</option>
            {countries
              .slice()
              .sort((a, b) => (a.full_name_locale || '').localeCompare(b.full_name_locale || ''))
              .map((c) => (
                <option key={c.id} value={c.two_letter_abbreviation}>{c.full_name_locale}</option>
              ))}
          </select>
          {errors.country && <div className="form-error">{errors.country}</div>}
        </div>
      )}

      <div className="form-row-3">
        <div className="form-group">
          <label className="form-label" htmlFor={id('city')}>City *</label>
          <input
            id={id('city')}
            type="text"
            value={v.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            onBlur={() => onBlur && onBlur('city')}
            placeholder="Enter city"
            required
            className={`form-input ${errors.city ? 'error' : ''}`}
          />
          {errors.city && <div className="form-error">{errors.city}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor={id('region')}>State / Region *</label>
          {availableRegions.length > 0 ? (
            <select
              id={id('region')}
              value={v.region_id || ''}
              onChange={(e) => {
                const sid = e.target.value;
                const region = availableRegions.find((r) => String(r.id) === String(sid));
                onChange('region_id', region ? Number(region.id) : null);
                onChange('region', region ? region.name : '');
                onChange('region_code', region ? region.code : '');
              }}
              onBlur={() => onBlur && onBlur('region')}
              required
              className={`form-select ${errors.region ? 'error' : ''}`}
            >
              <option value="">Select State</option>
              {availableRegions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input
              id={id('region')}
              type="text"
              value={v.region || ''}
              onChange={(e) => {
                onChange('region', e.target.value);
                onChange('region_id', null);
                onChange('region_code', '');
              }}
              onBlur={() => onBlur && onBlur('region')}
              placeholder="Enter state / region"
              required
              className={`form-input ${errors.region ? 'error' : ''}`}
            />
          )}
          {errors.region && <div className="form-error">{errors.region}</div>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor={id('postcode')}>Postal Code *</label>
          <input
            id={id('postcode')}
            type="text"
            inputMode="numeric"
            value={v.postcode || ''}
            onChange={(e) => onChange('postcode', e.target.value.replace(/[^A-Za-z0-9 -]/g, ''))}
            onBlur={() => onBlur && onBlur('postcode')}
            placeholder="Enter postal code"
            required
            className={`form-input ${errors.postcode ? 'error' : ''}`}
          />
          {errors.postcode && <div className="form-error">{errors.postcode}</div>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor={id('telephone')}>Phone Number *</label>
        <input
          id={id('telephone')}
          type="tel"
          inputMode="tel"
          value={v.telephone || ''}
          onChange={(e) => onChange('telephone', e.target.value.replace(/[^\d]/g, ''))}
          onBlur={() => onBlur && onBlur('telephone')}
          placeholder="Enter phone number"
          required
          className={`form-input ${errors.telephone ? 'error' : ''}`}
        />
        {errors.telephone && <div className="form-error">{errors.telephone}</div>}
      </div>
    </div>
  );
}
