import React from 'react';

const renderAddrLines = (addr) => (
  <>
    <div>{addr.firstname} {addr.lastname}</div>
    <div>{addr.street?.join(', ')}</div>
    <div>{addr.city}{addr.region?.region ? `, ${addr.region.region}` : ''} {addr.postcode}</div>
    <div>{addr.country_code}</div>
    {addr.telephone && <div className="muted">Tel: {addr.telephone}</div>}
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
        <div className="error-message">Error loading profile: {customerError.message}</div>
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
      <div className="profile-card profile-header-card">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div className="profile-header-main">
          <h4 className="profile-display-name">{fullName}</h4>
          <p className="profile-meta-row">
            <span className="profile-email-text">{c.email || user.email}</span>
            {memberSince && (
              <>
                <span className="profile-meta-dot" aria-hidden="true">·</span>
                <span className="profile-meta-since">Member since {memberSince}</span>
              </>
            )}
          </p>
        </div>
        <div className="profile-header-actions">
          <button className="btn-primary" onClick={onEditProfile}>Edit Profile</button>
          <button className="btn-secondary" onClick={onChangePassword}>Change Password</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="profile-stats">
        <button
          type="button"
          className="profile-stat"
          onClick={() => onSelectTab('orders')}
          aria-label={`Orders: ${ordersCount}`}
        >
          <span className="profile-stat-value">{ordersCount}</span>
          <span className="profile-stat-label">Orders</span>
        </button>
        <button
          type="button"
          className="profile-stat"
          onClick={() => onSelectTab('wishlist')}
          aria-label={`Wishlist: ${wishlistCount} items`}
        >
          <span className="profile-stat-value">{wishlistCount}</span>
          <span className="profile-stat-label">Wishlist Items</span>
        </button>
        <button
          type="button"
          className="profile-stat"
          onClick={() => onSelectTab('addresses')}
          aria-label={`Addresses: ${addresses.length}`}
        >
          <span className="profile-stat-value">{addresses.length}</span>
          <span className="profile-stat-label">Addresses</span>
        </button>
      </div>

      {/* Personal details */}
      {(dob || gender || c.is_subscribed != null) && (
        <div className="profile-card profile-details">
          <h4 className="profile-card-title">Personal Details</h4>
          <dl className="profile-details-grid">
            <div className="profile-detail">
              <dt>Email</dt>
              <dd>{c.email || user.email}</dd>
            </div>
            {dob && (
              <div className="profile-detail">
                <dt>Date of Birth</dt>
                <dd>{dob}</dd>
              </div>
            )}
            {gender && (
              <div className="profile-detail">
                <dt>Gender</dt>
                <dd>{gender}</dd>
              </div>
            )}
            <div className="profile-detail">
              <dt>Newsletter</dt>
              <dd>{c.is_subscribed ? 'Subscribed' : 'Not subscribed'}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Default addresses */}
      {(defaultShipping || defaultBilling) && (
        <div className="profile-default-addresses">
          <div className="profile-card profile-default-card">
            <div className="profile-card-head">
              <h4 className="profile-card-title">Default Shipping</h4>
            </div>
            {defaultShipping ? (
              <div className="profile-address">{renderAddrLines(defaultShipping)}</div>
            ) : (
              <p className="profile-default-empty">No default shipping address set.</p>
            )}
          </div>
          <div className="profile-card profile-default-card">
            <div className="profile-card-head">
              <h4 className="profile-card-title">Default Billing</h4>
              {sameDefault && <span className="profile-card-eyebrow">Same as shipping</span>}
            </div>
            {defaultBilling ? (
              <div className="profile-address">{renderAddrLines(defaultBilling)}</div>
            ) : (
              <p className="profile-default-empty">No default billing address set.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
