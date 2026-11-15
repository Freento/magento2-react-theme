// Shared Tailwind class strings for editor UI atoms that repeat across
// components (inputs, small buttons, segmented controls, the fw-* dropdowns).
// The leading semantic names (field-input, btn-icon, …) are unstyled hooks:
// editor.css keys some element rules off them (select arrow, scrollbars) and
// they keep the DOM greppable.

export const fieldInputCore =
  'field-input border border-solid border-ed-border rounded text-[12px] [font-family:inherit] text-ed-text bg-ed-surface outline-none ' +
  '[transition:background-color_0.1s,border-color_0.1s,box-shadow_0.1s] placeholder:text-ed-text-soft ' +
  'hover:bg-ed-surface hover:border-ed-border-strong ' +
  'focus:bg-ed-surface focus:border-ed-primary focus:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]';

export const fieldInput = `${fieldInputCore} w-full h-[30px] px-2`;

// Inline number beside a segmented / font-family control (width via style attr).
export const segInlineNumber =
  `${fieldInputCore} seg-inline-number flex-none h-7 px-1.5 text-right disabled:opacity-45 disabled:cursor-not-allowed`;

export const segInlineSuffix = 'seg-inline-suffix flex-none text-[11px] text-ed-text-soft -ml-0.5';

// Inline number beside a boolean toggle.
export const fieldCheckboxInlineNumber =
  `${fieldInputCore} field-checkbox-inline-number flex-none h-6 px-2 text-right disabled:opacity-50 disabled:cursor-not-allowed`;

export const fieldCheckboxInlineSuffix = 'field-checkbox-inline-suffix flex-none text-[11px] text-ed-text-soft -ml-1';

export const fieldCheckbox = 'field-checkbox flex items-center gap-2 py-0.5 text-[12px] text-ed-text select-none';
export const fieldCheckboxLabel = 'flex-1 font-normal text-[#424242] cursor-pointer';

export const btnIcon =
  'btn-icon w-6 h-6 inline-flex items-center justify-center border-none bg-transparent text-ed-text-soft rounded ' +
  'cursor-pointer [transition:all_0.1s] hover:bg-ed-surface-hover hover:text-ed-text';

export const btnIconDanger =
  'btn-icon danger w-6 h-6 inline-flex items-center justify-center border-none bg-transparent text-ed-text-soft rounded ' +
  'cursor-pointer [transition:all_0.1s] hover:bg-ed-danger-soft hover:text-ed-danger';

export const iconBtn =
  'icon-btn w-7 h-7 inline-flex items-center justify-center border border-solid border-transparent bg-transparent ' +
  'text-ed-text-muted rounded cursor-pointer [transition:all_0.1s] shrink-0 ' +
  'enabled:hover:bg-ed-surface-hover enabled:hover:text-ed-text enabled:hover:border-ed-border ' +
  'disabled:opacity-35 disabled:cursor-not-allowed';

export const btnSaveCore =
  'btn-save text-[13px] font-medium border border-solid border-transparent rounded cursor-pointer [transition:all_0.1s] ' +
  'text-white bg-ed-primary inline-flex items-center gap-1.5 whitespace-nowrap ' +
  'enabled:hover:bg-ed-primary-dark disabled:bg-ed-border disabled:text-[#F2F2EF] disabled:cursor-default';

export const btnSave = `${btnSaveCore} h-8 px-3.5`;

export const fieldHead = 'field-head flex items-center gap-1.5';
export const fieldLabel = 'field-label block text-[11.5px] font-normal text-[#424242]';

export const fieldOverrideReset =
  'field-override-reset inline-flex items-center justify-center w-[18px] h-[18px] p-0 border border-solid border-ed-primary ' +
  'bg-ed-primary-soft text-ed-primary rounded cursor-pointer [transition:all_0.1s] hover:bg-ed-primary hover:text-white';

export const dimensionsField = 'dimensions-field grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 min-w-0';

export const dimensionsCell =
  'dimensions-field-cell flex items-center gap-1.5 px-2 h-[30px] min-w-0 border border-solid border-ed-border rounded ' +
  'bg-ed-surface [transition:background-color_0.1s,border-color_0.1s,box-shadow_0.1s] cursor-text ' +
  'hover:bg-ed-surface hover:border-ed-border-strong ' +
  'focus-within:bg-ed-surface focus-within:border-ed-primary focus-within:shadow-[0_0_0_2px_rgba(15,76,92,0.18)]';

export const dimensionsInput =
  'flex-1 min-w-0 border-0 outline-none bg-transparent [font-family:inherit] text-[12px] text-ed-text p-0';

export const dimensionsPrefix =
  'dimensions-field-prefix text-[11px] font-medium text-ed-text-soft uppercase shrink-0 leading-none';

export const sliderField = 'slider-field flex items-center gap-2.5';

export const segmentedWrap = 'segmented grid gap-0.5 p-0.5 bg-ed-surface-hover border border-solid border-ed-border rounded';

export const segmentedItem = (active) =>
  'segmented-item inline-flex items-center justify-center gap-1.5 min-h-[26px] px-2 py-[3px] text-[12px] font-medium ' +
  'border-none rounded cursor-pointer [transition:all_0.1s] whitespace-nowrap ' +
  (active
    ? 'active bg-ed-surface text-ed-text shadow-[0_0_0_1px_#9E9E99,0_1px_2px_rgba(0,0,0,0.14)]'
    : 'bg-transparent text-ed-text hover:bg-ed-surface/60');

// fw-* — shared by FontFamilyField and FontWeightField.
export const fwField = (open) => `fw-field relative${open ? ' open' : ''}`;

export const fwTrigger = (open) =>
  'fw-field-trigger flex items-center justify-between gap-1.5 w-full h-7 px-2 bg-ed-surface border border-solid rounded ' +
  'text-[12px] text-ed-text text-left cursor-pointer [transition:border-color_0.1s] ' +
  '[&>svg]:flex-none [&>svg]:text-ed-text-soft ' +
  (open
    ? 'border-ed-primary shadow-[0_0_0_2px_rgba(15,76,92,0.18)]'
    : 'border-ed-border hover:border-ed-border-strong');

export const fwPopup =
  'fw-popup absolute z-[200] left-0 right-0 top-[calc(100%+4px)] flex flex-col gap-px p-1 bg-ed-surface ' +
  'border border-solid border-ed-border rounded-xl shadow-[0_10px_28px_rgba(15,23,42,0.18)] max-h-[280px] overflow-y-auto';

export const fwOption = (active) =>
  'fw-option flex items-center gap-1.5 w-full h-7 pl-1 pr-2 bg-transparent border-none rounded text-[12.5px] text-left ' +
  'cursor-pointer hover:bg-ed-surface-hover ' +
  (active ? 'active text-ed-primary' : 'text-ed-text');

export const fwOptionCheck = 'fw-option-check w-4 shrink-0 inline-flex items-center justify-center text-ed-primary';
export const fwOptionLabel = 'fw-option-label flex-1 min-w-0 truncate';

export const emptyState = 'empty-state text-ed-text-soft text-center px-5 py-[30px] text-[12.5px]';
