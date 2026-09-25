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
      <div className="flex flex-col gap-2.5 px-6 py-[22px] bg-bg border border-line rounded transition-colors duration-fast ease-[ease] hover:border-ink">
        <span className="text-2xs font-semibold tracking-eyebrow uppercase text-ink">{label}</span>
        <h4 className="m-0 text-lg font-semibold tracking-[-0.01em] text-ink">{address.firstname} {address.lastname}</h4>
        <div className="mt-1 mb-1.5">
          <p className="my-[3px] text-sm text-ink-2 leading-relaxed">{address.street?.join(', ')}</p>
          <p className="my-[3px] text-sm text-ink-2 leading-relaxed">{address.city}, {address.region?.region || ''} {address.postcode}</p>
          <p className="my-[3px] text-sm text-ink-2 leading-relaxed">{address.country_code}</p>
          {address.telephone && <p className="my-[3px] text-sm text-ink-2 leading-relaxed">{address.telephone}</p>}
          {address.company && <p className="my-[3px] text-sm text-ink-2 leading-relaxed">{address.company}</p>}
        </div>
        <div className="mt-4 flex gap-2 flex-wrap">
          <button type="button" className="btn-secondary" onClick={() => onEditAddress(address)}>Edit</button>
        </div>
      </div>
    ) : (
      <div className="flex flex-col gap-2.5 px-6 py-[22px] bg-surface border border-dashed border-line rounded transition-colors duration-fast ease-[ease]">
        <span className="text-2xs font-semibold tracking-eyebrow uppercase text-ink">{label}</span>
        <p className="mt-1 mb-3 text-sm text-ink-2">No {label.toLowerCase()} address set yet.</p>
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
          <section className="mb-6 last:mb-0">
            <header className="flex items-center justify-between gap-3 mb-3.5">
              <span className="inline-flex items-center gap-2.5 text-2xs font-semibold tracking-eyebrow uppercase text-ink-2">Defaults</span>
            </header>
            <div className={`grid gap-4 max768:grid-cols-1 ${sharedDefault ? 'grid-cols-1' : 'grid-cols-2'}`}>
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

          <section className="mb-6 last:mb-0">
            <header className="flex items-center justify-between gap-3 mb-3.5">
              <span className="inline-flex items-center gap-2.5 text-2xs font-semibold tracking-eyebrow uppercase text-ink-2">
                Other addresses
                <span className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-pill bg-surface text-ink text-2xs font-semibold tracking-normal">{otherAddresses.length}</span>
              </span>
              <button type="button" className="inline-flex items-center gap-1.5 h-8 px-3 border border-line rounded bg-bg text-sm font-medium text-ink cursor-pointer transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface" onClick={onAddAddress}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Add new</span>
              </button>
            </header>
            {otherAddresses.length > 0 ? (
              <div className="w-full max768:overflow-x-auto max768:[-webkit-overflow-scrolling:touch]">
              <div className="grid grid-cols-[1fr_1.4fr_1.4fr_0.8fr_1fr_auto] bg-bg border border-line rounded overflow-hidden max768:min-w-[720px]" role="table" aria-label="Saved addresses">
                <div className="contents" role="row">
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2">Name</span>
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2">Street</span>
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2">City / Region / ZIP</span>
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2">Country</span>
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2">Phone</span>
                  <span role="columnheader" className="px-4 py-3 bg-surface text-2xs font-semibold tracking-[0.1em] uppercase text-ink-2 text-right">Actions</span>
                </div>
                {otherAddresses.map((address) => (
                  <div key={address.id} className="contents" role="row">
                    <span role="cell" data-label="Name" className="px-4 py-3.5 border-t border-line text-sm flex items-center min-w-0 font-semibold text-ink">
                      {address.firstname} {address.lastname}
                    </span>
                    <span className="px-4 py-3.5 border-t border-line text-sm text-ink-2 flex items-center min-w-0" role="cell" data-label="Street">{address.street?.join(', ')}</span>
                    <span className="px-4 py-3.5 border-t border-line text-sm text-ink-2 flex items-center min-w-0" role="cell" data-label="City / Region / ZIP">
                      {address.city}{address.region?.region ? `, ${address.region.region}` : ''} {address.postcode}
                    </span>
                    <span className="px-4 py-3.5 border-t border-line text-sm text-ink-2 flex items-center min-w-0" role="cell" data-label="Country">{address.country_code}</span>
                    <span className="px-4 py-3.5 border-t border-line text-sm text-ink-2 flex items-center min-w-0" role="cell" data-label="Phone">{address.telephone || '—'}</span>
                    <span role="cell" className="px-4 py-3.5 border-t border-line text-sm text-ink-2 flex flex-nowrap items-center min-w-0 justify-end gap-2">
                      <button type="button" className="btn-secondary h-8 px-3 py-0 text-sm m-0 w-auto" onClick={() => onEditAddress(address)}>Edit</button>
                      <button type="button" className="btn-danger h-8 px-3 py-0 text-sm m-0 w-auto" onClick={() => onDeleteAddress(address.id)}>Delete</button>
                    </span>
                  </div>
                ))}
              </div>
              </div>
            ) : (
              <p className="m-0 p-6 border border-dashed border-line rounded text-sm text-ink-2 text-center">No additional addresses saved.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AddressBookTab;
