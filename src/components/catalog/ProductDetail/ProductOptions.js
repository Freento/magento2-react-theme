import React from 'react';
import { selectedLabel } from './helpers/productVariants';

const ProductOptions = ({ swatchOptions, buttonOptions, selectedOptions, onOptionChange }) => (
  <>
    {swatchOptions.map((option) => (
      <div key={option.id} className="option-group">
        <div className="option-group__head">
          <b>{option.label}</b>
          <span className="value">{selectedLabel(option, selectedOptions) || '—'}</span>
        </div>
        <div className="swatches" role="radiogroup" aria-label={option.label}>
          {option.values.map((v) => {
            const selected = Number(selectedOptions[option.attribute_code]) === Number(v.value_index);
            const bg = v.swatch_data?.value && v.swatch_data.value.startsWith('#')
              ? v.swatch_data.value
              : (v.label || '').toLowerCase();
            return (
              <button
                key={v.value_index}
                type="button"
                className="swatch"
                aria-pressed={selected}
                aria-label={v.label}
                title={v.label}
                style={{ background: bg }}
                onClick={() => onOptionChange(option.attribute_code, v.value_index)}
              />
            );
          })}
        </div>
      </div>
    ))}

    {buttonOptions.map((option) => {
      const isSize = option.attribute_code === 'size';
      return (
        <div key={option.id} className="option-group">
          <div className="option-group__head">
            <b>{option.label}</b>
            {isSize ? (
              <a href="#" className="size-guide-link" onClick={(e) => e.preventDefault()}>Size guide</a>
            ) : (
              <span className="value">{selectedLabel(option, selectedOptions) || '—'}</span>
            )}
          </div>
          <div className="sizes" role="radiogroup" aria-label={option.label}>
            {option.values.map((v) => {
              const selected = Number(selectedOptions[option.attribute_code]) === Number(v.value_index);
              return (
                <button
                  key={v.value_index}
                  type="button"
                  className="size-btn"
                  aria-pressed={selected}
                  onClick={() => onOptionChange(option.attribute_code, v.value_index)}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    })}
  </>
);

export default ProductOptions;
