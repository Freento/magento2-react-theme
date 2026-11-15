import React from 'react';

const SaveForLaterCheckbox = ({ checked, onChange, disabled = false, label = 'Save for later use', className = '' }) => (
  <label className={`save-card-toggle flex items-center gap-2.5 text-sm text-ink cursor-pointer ${className}`}>
    <input
      type="checkbox"
      className="w-4 h-4 accent-ink cursor-pointer"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={disabled}
    />
    {label}
  </label>
);

export default SaveForLaterCheckbox;
