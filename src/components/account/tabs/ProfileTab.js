import React from 'react';

const renderAddrLines = (addr) => (
  <>
    <div>{addr.firstname} {addr.lastname}</div>
    <div>{addr.street?.join(', ')}</div>
    <div>{addr.city}{addr.region?.region ? `, ${addr.region.region}` : ''} {addr.postcode}</div>
    <div>{addr.country_code}</div>
    {addr.telephone && <div className="text-ink-2">Tel: {addr.telephone}</div>}
  </>
);

const ProfileTab = ({
  customerError,
  customer = {},
  user,
  ordersCount = 0,
  wishlistCount = 0,
  onEditProfile,
  onChangePassword,
  onSelectTab,
}) => {
  if (customerError) {
    return (
      <div className="account-section">
        <div className="bg-danger-bg border border-danger-border text-danger px-3.5 py-3 rounded mb-4 text-13 leading-[1.45]">Error loading profile: {customerError.message}</div>
      </div>
    );
  }

  const c = customer;
  const firstname = c.firstname || '';
  const lastname = c.lastname || '';
  const fullName = `${firstname} ${lastname}`.trim() || (c.email || user.email || 'Customer');
  const initials = [(firstname[0] || ''), (lastname[0] || '')].join('').toUpperCase()
    || (c.email || user.email || '?')[0]?.toUpperCase();
  const memberSince = c.created_at
    ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;
  const dob = c.date_of_birth
    ? new Date(c.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const gender = c.gender === 1 ? 'Male' : c.gender === 2 ? 'Female' : null;
  const addresses = c.addresses || [];
  const defaultShipping = addresses.find((a) => a.default_shipping);
  const defaultBilling = addresses.find((a) => a.default_billing);
  const sameDefault = defaultShipping && defaultBilling && defaultShipping.id === defaultBilling.id;

  return (
    <div className="account-section">

      {/* Header — avatar + name + meta */}
      <div className="bg-bg border border-line rounded px-6 py-[22px] mb-3.5 grid grid-cols-[auto_1fr_auto] gap-5 items-center max720:grid-cols-[auto_1fr]">
        <div className="w-16 h-16 rounded-full bg-ink text-bg inline-flex items-center justify-center text-[24px] font-semibold tracking-[-0.02em]" aria-hidden="true">{initials}</div>
        <div className="min-w-0">
          <h4 className="mt-0 mb-1.5 text-2xl font-semibold tracking-[-0.015em] text-ink leading-tight">{fullName}</h4>
          <p className="m-0 flex items-center flex-wrap gap-2 text-sm text-ink-2">
            <span className="text-ink">{c.email || user.email}</span>
            {memberSince && (
              <>
                <span className="text-ink-2" aria-hidden="true">·</span>
                <span className="profile-meta-since">Member since {memberSince}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0 max720:col-span-full max720:flex-row max720:flex-wrap">
          <button className="btn-primary w-auto m-0 min-w-[140px] h-9 px-4 py-0 max720:min-w-0 max720:flex-1" onClick={onEditProfile}>Edit Profile</button>
          <button className="btn-secondary w-auto m-0 min-w-[140px] h-9 px-4 py-0 max720:min-w-0 max720:flex-1" onClick={onChangePassword}>Change Password</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-3.5 max480:grid-cols-1">
        <button
          type="button"
          className="appearance-none flex flex-col items-start gap-1 px-5 py-[18px] bg-bg border border-line rounded cursor-pointer text-left text-ink transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface"
          onClick={() => onSelectTab('orders')}
          aria-label={`Orders: ${ordersCount}`}
        >
          <span className="text-2xl font-semibold tracking-[-0.02em] tabular-nums leading-none">{ordersCount}</span>
          <span className="text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Orders</span>
        </button>
        <button
          type="button"
          className="appearance-none flex flex-col items-start gap-1 px-5 py-[18px] bg-bg border border-line rounded cursor-pointer text-left text-ink transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface"
          onClick={() => onSelectTab('wishlist')}
          aria-label={`Wishlist: ${wishlistCount} items`}
        >
          <span className="text-2xl font-semibold tracking-[-0.02em] tabular-nums leading-none">{wishlistCount}</span>
          <span className="text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Wishlist Items</span>
        </button>
        <button
          type="button"
          className="appearance-none flex flex-col items-start gap-1 px-5 py-[18px] bg-bg border border-line rounded cursor-pointer text-left text-ink transition-colors duration-fast ease-[ease] hover:border-ink hover:bg-surface"
          onClick={() => onSelectTab('addresses')}
          aria-label={`Addresses: ${addresses.length}`}
        >
          <span className="text-2xl font-semibold tracking-[-0.02em] tabular-nums leading-none">{addresses.length}</span>
          <span className="text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Addresses</span>
        </button>
      </div>

      {/* Personal details */}
      {(dob || gender || c.is_subscribed != null) && (
        <div className="bg-bg border border-line rounded px-6 py-[22px] mb-3.5">
          <h4 className="mt-0 mb-3.5 text-lg font-semibold tracking-[-0.01em] text-ink">Personal Details</h4>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 m-0 max480:grid-cols-1">
            <div className="profile-detail">
              <dt className="mt-0 mb-1 text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Email</dt>
              <dd className="m-0 text-base text-ink [word-break:break-word]">{c.email || user.email}</dd>
            </div>
            {dob && (
              <div className="profile-detail">
                <dt className="mt-0 mb-1 text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Date of Birth</dt>
                <dd className="m-0 text-base text-ink [word-break:break-word]">{dob}</dd>
              </div>
            )}
            {gender && (
              <div className="profile-detail">
                <dt className="mt-0 mb-1 text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Gender</dt>
                <dd className="m-0 text-base text-ink [word-break:break-word]">{gender}</dd>
              </div>
            )}
            <div className="profile-detail">
              <dt className="mt-0 mb-1 text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Newsletter</dt>
              <dd className="m-0 text-base text-ink [word-break:break-word]">{c.is_subscribed ? 'Subscribed' : 'Not subscribed'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Default addresses */}
      {(defaultShipping || defaultBilling) && (
        <div className="grid grid-cols-2 gap-3.5 max720:grid-cols-1">
          <div className="bg-bg border border-line rounded px-6 py-[22px] mb-3.5">
            <div className="flex items-baseline justify-between gap-2.5 flex-wrap mb-3">
              <h4 className="m-0 text-base font-semibold tracking-[-0.01em] text-ink">Default Shipping</h4>
            </div>
            {defaultShipping ? (
              <div className="text-sm text-ink leading-relaxed">{renderAddrLines(defaultShipping)}</div>
            ) : (
              <p className="m-0 text-sm italic text-ink-2">No default shipping address set.</p>
            )}
          </div>
          <div className="bg-bg border border-line rounded px-6 py-[22px] mb-3.5">
            <div className="flex items-baseline justify-between gap-2.5 flex-wrap mb-3">
              <h4 className="m-0 text-base font-semibold tracking-[-0.01em] text-ink">Default Billing</h4>
              {sameDefault && <span className="text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Same as shipping</span>}
            </div>
            {defaultBilling ? (
              <div className="text-sm text-ink leading-relaxed">{renderAddrLines(defaultBilling)}</div>
            ) : (
              <p className="m-0 text-sm italic text-ink-2">No default billing address set.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
