import React from 'react';

const AddressBookTab = ({ addresses = [], onEditAddress, onAddAddress, onDeleteAddress }) => {
  const hasAddresses = addresses.length > 0;

  const defaultShipping = addresses.find((a) => a.default_shipping);
  const defaultBilling = addresses.find((a) => a.default_billing);
  const sharedDefault =
    defaultShipping && defaultBilling && defaultShipping.id === defaultBilling.id
      ? defaultShipping
      : null;
  const otherAddresses = addresses.filter(
    (a) => !a.default_shipping && !a.default_billing
  );

  const renderDefaultCard = (label, address) => (
    address ? (
      <div className="address-default-card">
        <span className="address-default-eyebrow">{label}</span>
        <h4 className="address-default-name">{address.firstname} {address.lastname}</h4>
        <div className="address-default-body">
          <p>{address.street?.join(', ')}</p>
          <p>{address.city}, {address.region?.region || ''} {address.postcode}</p>
          <p>{address.country_code}</p>
          {address.telephone && <p>{address.telephone}</p>}
          {address.company && <p>{address.company}</p>}
        </div>
        <div className="address-actions">
          <button type="button" className="btn-secondary" onClick={() => onEditAddress(address)}>Edit</button>
        </div>
      </div>
    ) : (
      <div className="address-default-card address-default-card--empty">
        <span className="address-default-eyebrow">{label}</span>
        <p className="address-default-empty-text">No {label.toLowerCase()} address set yet.</p>
        <button type="button" className="btn-secondary" onClick={onAddAddress}>Set {label.toLowerCase()}</button>
      </div>
    )
  );

  return (
    <div className="account-section">
      {!hasAddresses ? (
        <div className="empty-state">
          <p>No addresses found</p>
          <button className="btn-primary" onClick={onAddAddress}>Add New Address</button>
        </div>
      ) : (
        <>
          <section className="address-section">
            <header className="address-section-head">
              <span className="address-section-eyebrow">Defaults</span>
            </header>
            <div className={`address-defaults-grid${sharedDefault ? ' address-defaults-grid--single' : ''}`}>
              {sharedDefault ? (
                renderDefaultCard('Default Shipping & Billing', sharedDefault)
              ) : (
                <>
                  {renderDefaultCard('Default Shipping', defaultShipping)}
                  {renderDefaultCard('Default Billing', defaultBilling)}
                </>
              )}
            </div>
          </section>

          <section className="address-section">
            <header className="address-section-head">
              <span className="address-section-eyebrow">
                Other addresses
                <span className="address-section-count">{otherAddresses.length}</span>
              </span>
              <button type="button" className="address-add-link" onClick={onAddAddress}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add new</span>
              </button>
            </header>
            {otherAddresses.length > 0 ? (
              <div className="address-table-scroll">
              <div className="address-table" role="table" aria-label="Saved addresses">
                <div className="address-table-head" role="row">
                  <span role="columnheader">Name</span>
                  <span role="columnheader">Street</span>
                  <span role="columnheader">City / Region / ZIP</span>
                  <span role="columnheader">Country</span>
                  <span role="columnheader">Phone</span>
                  <span role="columnheader" className="address-col-actions">Actions</span>
                </div>
                {otherAddresses.map((address) => (
                  <div key={address.id} className="address-table-row" role="row">
                    <span role="cell" data-label="Name" className="address-cell-name">
                      {address.firstname} {address.lastname}
                    </span>
                    <span role="cell" data-label="Street">{address.street?.join(', ')}</span>
                    <span role="cell" data-label="City / Region / ZIP">
                      {address.city}{address.region?.region ? `, ${address.region.region}` : ''} {address.postcode}
                    </span>
                    <span role="cell" data-label="Country">{address.country_code}</span>
                    <span role="cell" data-label="Phone">{address.telephone || '—'}</span>
                    <span role="cell" className="address-cell-actions">
                      <button type="button" className="btn-secondary" onClick={() => onEditAddress(address)}>Edit</button>
                      <button type="button" className="btn-danger" onClick={() => onDeleteAddress(address.id)}>Delete</button>
                    </span>
                  </div>
                ))}
              </div>
              </div>
            ) : (
              <p className="address-others-empty">No additional addresses saved.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AddressBookTab;
