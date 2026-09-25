import React from 'react';
import AddressFormFields from '../AddressFormFields';

const AddressModal = ({
  open,
  onClose,
  editMode,
  formData,
  onFieldChange,
  validation,
  countries,
  availableRegions,
  optionalZipCountries,
  onSave,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-[1000] p-5 box-border animate-scrim-quick max768:p-0 max768:items-stretch" onClick={onClose}>
      <div className="address-modal bg-bg border border-line rounded max-w-[720px] max-h-[90vh] w-full overflow-y-auto relative animate-modal-quick max768:max-h-screen max768:max-w-[100vw] max768:rounded-none max768:border-x-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-line sticky top-0 bg-bg z-[1001] max768:px-4 max768:py-3.5">
          <h2 className="m-0 text-lg font-semibold tracking-[-0.01em] text-ink max768:text-[16px]">{editMode === 'edit' ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="w-8 h-8 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink-2 transition-colors duration-fast ease-[ease] hover:bg-surface hover:text-ink text-[24px] p-0 rounded" onClick={onClose}>×</button>
        </div>

        <div className="p-6 max768:p-4">
          <div className="flex flex-col gap-4">
            <AddressFormFields
              value={formData}
              onChange={onFieldChange}
              onBlur={validation.onBlur}
              errors={validation.errors}
              countries={countries}
              availableRegions={availableRegions}
              optionalZipCountries={optionalZipCountries}
              idPrefix="address-book"
              showApartment
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultShipping"
                  className="w-4 h-4 accent-ink m-0 cursor-pointer"
                  checked={formData.default_shipping}
                  onChange={(e) => onFieldChange('default_shipping', e.target.checked)}
                />
                <label htmlFor="defaultShipping" className="text-13 font-normal text-ink-2 m-0 cursor-pointer">Set as default shipping address</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultBilling"
                  className="w-4 h-4 accent-ink m-0 cursor-pointer"
                  checked={formData.default_billing}
                  onChange={(e) => onFieldChange('default_billing', e.target.checked)}
                />
                <label htmlFor="defaultBilling" className="text-13 font-normal text-ink-2 m-0 cursor-pointer">Set as default billing address</label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-line max768:flex-col-reverse">
              <button className="btn-primary max768:w-full" onClick={onSave}>
                {editMode === 'edit' ? 'Update Address' : 'Add Address'}
              </button>
              <button className="btn-secondary max768:w-full" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
