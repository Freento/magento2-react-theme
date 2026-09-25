import React from 'react';
import { selectedLabel } from './helpers/productVariants';

const ProductOptions = ({ swatchOptions, buttonOptions, selectedOptions, onOptionChange }) => (
  <>
    {swatchOptions.map((option) => (
      <div key={option.id} className="option-group mb-[22px]">
        <div className="option-group__head flex justify-between items-center text-13 mb-2.5">
          <b className="font-medium text-ink">{option.label}</b>
          <span className="value text-ink-2">{selectedLabel(option, selectedOptions) || '—'}</span>
        </div>
        <div className="swatches flex gap-2.5" role="radiogroup" aria-label={option.label}>
          {option.values.map((v) => {
            const selected = Number(selectedOptions[option.attribute_code]) === Number(v.value_index);
            const bg = v.swatch_data?.value && v.swatch_data.value.startsWith('#')
              ? v.swatch_data.value
              : (v.label || '').toLowerCase();
            return (
              <button
                key={v.value_index}
                type="button"
                className="swatch w-8 h-8 rounded-pill border border-ink/[0.12] cursor-pointer p-0 outline outline-2 outline-offset-2 outline-transparent [transition:outline-color_120ms_ease] hover:outline-ink/[0.35] aria-pressed:!outline-ink"
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
      return (
        <div key={option.id} className="option-group mb-[22px]">
          <div className="option-group__head flex justify-between items-center text-13 mb-2.5">
            <b className="font-medium text-ink">{option.label}</b>
            <span className="value text-ink-2">{selectedLabel(option, selectedOptions) || '—'}</span>
          </div>
          <div className="sizes flex flex-wrap gap-2" role="radiogroup" aria-label={option.label}>
            {option.values.map((v) => {
              const selected = Number(selectedOptions[option.attribute_code]) === Number(v.value_index);
              return (
                <button
                  key={v.value_index}
                  type="button"
                  className="size-btn min-w-[48px] h-10 px-3 py-0 border border-line rounded text-13 font-medium bg-bg text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:enabled:border-ink aria-pressed:!bg-ink aria-pressed:!text-bg aria-pressed:!border-ink disabled:text-ink-2 disabled:bg-surface disabled:cursor-not-allowed disabled:relative disabled:after:content-[''] disabled:after:absolute disabled:after:left-[8%] disabled:after:right-[8%] disabled:after:top-1/2 disabled:after:h-px disabled:after:bg-line disabled:after:-rotate-12"
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
