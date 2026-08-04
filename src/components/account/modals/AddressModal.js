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
    <div className="modal-overlay" onClick={onClose}>
      <div className="address-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editMode === 'edit' ? 'Edit Address' : 'Add New Address'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="address-form">
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

            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="defaultShipping"
                  checked={formData.default_shipping}
                  onChange={(e) => onFieldChange('default_shipping', e.target.checked)}
                />
                <label htmlFor="defaultShipping" className="checkbox-label">Set as default shipping address</label>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="defaultBilling"
                  checked={formData.default_billing}
                  onChange={(e) => onFieldChange('default_billing', e.target.checked)}
                />
                <label htmlFor="defaultBilling" className="checkbox-label">Set as default billing address</label>
              </div>
            </div>

            <div className="address-actions">
              <button className="btn-primary" onClick={onSave}>
                {editMode === 'edit' ? 'Update Address' : 'Add Address'}
              </button>
              <button className="btn-secondary" onClick={onClose}>
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
