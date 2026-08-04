import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { GET_CUSTOMER_DATA, GET_CUSTOMER_ORDERS, CREATE_CUSTOMER_ADDRESS, UPDATE_CUSTOMER_ADDRESS, DELETE_CUSTOMER_ADDRESS, GET_CUSTOMER_WISHLIST, REMOVE_PRODUCTS_FROM_WISHLIST, REORDER_ITEMS } from '../../queries/customer';
import { GET_COUNTRIES } from '../../queries/checkout';
import useAddressValidation from '../../hooks/useAddressValidation';
import useProfileForm from './hooks/useProfileForm';
import EditProfileModal from './modals/EditProfileModal';
import ChangePasswordModal from './modals/ChangePasswordModal';
import AddressModal from './modals/AddressModal';
import ProfileTab from './tabs/ProfileTab';
import AddressBookTab from './tabs/AddressBookTab';
import OrdersTab from './tabs/OrdersTab';
import WishlistTab from './tabs/WishlistTab';
import '../../styles/account/MyAccount.less';

const MyAccount = () => {
  const { user, logout, initialLoading, openLoginModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { refetchCart, openMiniCart } = useCart();
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderError, setReorderError] = useState('');
  const [reorderItems] = useMutation(REORDER_ITEMS);
  const viewingOrderNumber = new URLSearchParams(location.search || '').get('order');
  const [activeTab, setActiveTab] = useState('profile');
  // Address management state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressEditMode, setAddressEditMode] = useState('add'); // 'add' or 'edit'
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    firstname: '',
    lastname: '',
    street: ['', ''],
    city: '',
    region_id: '',
    postcode: '',
    country_code: 'US',
    telephone: '',
    default_shipping: false,
    default_billing: false
  });
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  // Wishlist management state
  const [wishlistActionError, setWishlistActionError] = useState('');
  const [wishlistActionSuccess, setWishlistActionSuccess] = useState('');
  const [wishlistPage, setWishlistPage] = useState(1);
  const [wishlistPageSize] = useState(12);

  const { data: customerData, loading: customerLoading, error: customerError, refetch: refetchCustomerData } = useQuery(GET_CUSTOMER_DATA);
  const [ordersPage, setOrdersPage] = useState(1);
  const ordersPageSize = 10;
  const { data: ordersData, loading: ordersLoading, error: ordersError } = useQuery(GET_CUSTOMER_ORDERS, {
    variables: { pageSize: ordersPageSize, currentPage: ordersPage }
  });
  const { data: wishlistData, loading: wishlistLoading, error: wishlistError, refetch: refetchWishlist } = useQuery(GET_CUSTOMER_WISHLIST, {
    variables: { currentPage: wishlistPage, pageSize: wishlistPageSize },
    notifyOnNetworkStatusChange: true,
  });

  const { data: countriesData } = useQuery(GET_COUNTRIES, { fetchPolicy: 'cache-first' });
  const optionalZipCountries = [];

  const availableRegions =
    countriesData?.countries?.find(
      (c) => c.two_letter_abbreviation === addressFormData.country_code
    )?.available_regions || [];

  const addrValidation = useAddressValidation(addressFormData, {
    availableRegions,
    optionalZipCountries,
  });

  const {
    editFormData,
    isEditProfileModalOpen,
    isEmailEditable,
    setIsEmailEditable,
    passwordData,
    isChangePasswordModalOpen,
    saveError, saveSuccess, setSaveError, setSaveSuccess,
    passwordError, passwordSuccess, setPasswordError, setPasswordSuccess,
    handleEditProfile,
    handleCancelEdit,
    handleSaveProfile,
    handleInputChange,
    handleOpenChangePassword,
    handleCloseChangePassword,
    handlePasswordChange,
    handleChangePassword,
  } = useProfileForm({ customerData, user, refetchCustomerData });

  const [createCustomerAddress] = useMutation(CREATE_CUSTOMER_ADDRESS, {
    update(cache, { data }) {
      const newAddr = data?.createCustomerAddress;
      if (!newAddr) return;
      const existing = cache.readQuery({ query: GET_CUSTOMER_DATA });
      if (!existing?.customer) return;
      const prev = existing.customer.addresses || [];
      const next = prev.map((a) => ({
        ...a,
        default_shipping: newAddr.default_shipping ? false : a.default_shipping,
        default_billing: newAddr.default_billing ? false : a.default_billing,
      }));
      cache.writeQuery({
        query: GET_CUSTOMER_DATA,
        data: {
          customer: { ...existing.customer, addresses: [...next, newAddr] },
        },
      });
    },
  });
  const [updateCustomerAddress] = useMutation(UPDATE_CUSTOMER_ADDRESS, {
    update(cache, { data }) {
      const updated = data?.updateCustomerAddress;
      if (!updated) return;
      const existing = cache.readQuery({ query: GET_CUSTOMER_DATA });
      if (!existing?.customer) return;
      const prev = existing.customer.addresses || [];
      const next = prev.map((a) => {
        if (Number(a.id) === Number(updated.id)) return { ...a, ...updated };
        return {
          ...a,
          default_shipping: updated.default_shipping ? false : a.default_shipping,
          default_billing: updated.default_billing ? false : a.default_billing,
        };
      });
      cache.writeQuery({
        query: GET_CUSTOMER_DATA,
        data: { customer: { ...existing.customer, addresses: next } },
      });
    },
  });
  const [deleteCustomerAddress] = useMutation(DELETE_CUSTOMER_ADDRESS, {
    update(cache, { data }, { variables }) {
      if (!data?.deleteCustomerAddress) return;
      const id = variables?.id;
      const existing = cache.readQuery({ query: GET_CUSTOMER_DATA });
      if (existing?.customer) {
        cache.writeQuery({
          query: GET_CUSTOMER_DATA,
          data: {
            customer: {
              ...existing.customer,
              addresses: (existing.customer.addresses || []).filter(
                (a) => Number(a.id) !== Number(id),
              ),
            },
          },
        });
      }
      cache.evict({ id: `CustomerAddress:${id}` });
      cache.gc();
    },
  });
  const [removeProductsFromWishlist] = useMutation(REMOVE_PRODUCTS_FROM_WISHLIST, {
    refetchQueries: ['getCustomerWishlist'],
    awaitRefetchQueries: true,
    update(cache, _result, { variables }) {
      if (!variables?.wishlistId) return;
      const removedIds = new Set((variables.wishlistItemsIds || []).map(String));
      cache.modify({
        id: cache.identify({ __typename: 'Wishlist', id: variables.wishlistId }),
        fields: {
          items_count(existing) {
            return Math.max(0, (existing || 0) - removedIds.size);
          },
          items_v2(existing, { readField }) {
            if (!existing?.items) return existing;
            const items = existing.items.filter((ref) => !removedIds.has(String(readField('id', ref))));
            return { ...existing, items };
          },
        },
      });
    },
  });

  useEffect(() => {
    const fromState = location.state?.activeTab;
    const fromQuery = new URLSearchParams(location.search || '').get('tab');
    const next = fromState || fromQuery;
    if (next) setActiveTab(next);
  }, [location.state, location.search]);

  const selectTab = (id) => {
    setActiveTab(id);
    const params = new URLSearchParams(location.search || '');
    params.set('tab', id);
    params.delete('order');
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: false });
  };

  if (initialLoading || (user && customerLoading)) {
    const pendingTab =
      location.state?.activeTab ||
      new URLSearchParams(location.search || '').get('tab') ||
      'profile';

    const profileSkel = (
      <div className="ma-skel-profile">
        <div className="ma-skel-row">
          <div className="ma-skel-field-group">
            <span className="skeleton ma-skel-label" />
            <span className="skeleton ma-skel-value" />
          </div>
          <div className="ma-skel-field-group">
            <span className="skeleton ma-skel-label" />
            <span className="skeleton ma-skel-value" />
          </div>
        </div>
        <div className="ma-skel-row">
          <div className="ma-skel-field-group">
            <span className="skeleton ma-skel-label" />
            <span className="skeleton ma-skel-value" />
          </div>
          <div className="ma-skel-field-group">
            <span className="skeleton ma-skel-label" />
            <span className="skeleton ma-skel-value" />
          </div>
        </div>
        <span className="skeleton ma-skel-btn" />
      </div>
    );

    const addressesSkel = (
      <div className="ma-skel-addresses">
        <span className="skeleton ma-skel-addr-eyebrow" />
        <div className="address-defaults-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={`addr-def-${i}`} className="address-default-card" aria-hidden="true">
              <span className="skeleton ma-skel-addr-eyebrow" />
              <span className="skeleton ma-skel-addr-name" />
              <span className="skeleton ma-skel-addr-line" />
              <span className="skeleton ma-skel-addr-line" />
              <span className="skeleton ma-skel-addr-line" />
              <span className="skeleton ma-skel-addr-line" />
              <div className="address-actions">
                <span className="skeleton ma-skel-addr-btn" />
                <span className="skeleton ma-skel-addr-btn" />
              </div>
            </div>
          ))}
        </div>
        <span className="skeleton ma-skel-addr-eyebrow ma-skel-mt-28" />
        <div className="address-table" aria-hidden="true">
          <div className="address-table-head">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={`addr-th-${i}`} role="columnheader">
                <span className="skeleton ma-skel-addr-th" />
              </span>
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, r) => (
            <div key={`addr-tr-${r}`} className="address-table-row">
              {Array.from({ length: 6 }).map((_, c) => (
                <span key={`addr-tc-${r}-${c}`} role="cell">
                  <span className="skeleton ma-skel-addr-td" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    );

    let mainSkel = profileSkel;
    if (pendingTab === 'addresses') mainSkel = addressesSkel;

    return (
      <div className="my-account-container ma-skel" aria-busy="true" aria-live="polite">
        <div className="account-header">
          <div>
            <span className="skeleton ma-skel-page-title" />
            <span className="skeleton ma-skel-page-sub" />
          </div>
          <span className="skeleton ma-skel-page-btn" />
        </div>
        <div className="account-content">
          <nav className="account-nav">
            <ul className="nav-tabs">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={`tab-${i}`}>
                  <span className="skeleton ma-skel-nav-tab" />
                </li>
              ))}
            </ul>
          </nav>
          <main className="account-main">
            <div className="account-section">
              <span className="skeleton ma-skel-section-title" />
              {mainSkel}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="my-account-container">
        <section className="ma-gate" aria-labelledby="ma-gate-title">
          <span className="ma-gate-eyebrow">Sign in required</span>
          <h2 id="ma-gate-title" className="ma-gate-title">This area is for members.</h2>
          <p className="ma-gate-text">
            Sign in to view your orders, addresses, and saved items. New here?
            You can create an account in under a minute.
          </p>
          <div className="ma-gate-actions">
            <button
              type="button"
              className="ma-gate-btn ma-gate-btn--primary"
              onClick={openLoginModal}
            >
              Sign in
            </button>
            <Link to="/" className="ma-gate-btn ma-gate-btn--ghost">
              Back to home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'addresses', label: 'Address Book' },
    { id: 'orders', label: 'Order History' },
    { id: 'wishlist', label: 'My Wishlist' }
  ];

  // Address management functions
  const handleOpenAddAddress = () => {
    setAddressEditMode('add');
    setEditingAddress(null);
    setAddressFormData({
      firstname: '',
      lastname: '',
      street: ['', ''],
      city: '',
      region_id: '',
      postcode: '',
      country_code: 'US',
      telephone: '',
      default_shipping: false,
      default_billing: false
    });
    setIsAddressModalOpen(true);
    setAddressError('');
    setAddressSuccess('');
  };

  const handleOpenEditAddress = (address) => {
    setAddressEditMode('edit');
    setEditingAddress(address);
    setAddressFormData({
      firstname: address.firstname || '',
      lastname: address.lastname || '',
      street: address.street || ['', ''],
      city: address.city || '',
      region_id: address.region?.region_id || '',
      postcode: address.postcode || '',
      country_code: address.country_code || 'US',
      telephone: address.telephone || '',
      default_shipping: address.default_shipping || false,
      default_billing: address.default_billing || false
    });
    setIsAddressModalOpen(true);
    setAddressError('');
    setAddressSuccess('');
  };

  const handleCloseAddressModal = () => {
    setIsAddressModalOpen(false);
    setAddressEditMode('add');
    setEditingAddress(null);
    setAddressFormData({
      firstname: '',
      lastname: '',
      street: ['', ''],
      city: '',
      region_id: '',
      postcode: '',
      country_code: 'US',
      telephone: '',
      default_shipping: false,
      default_billing: false
    });
    setAddressError('');
    setAddressSuccess('');
    addrValidation.reset();
  };

  const handleAddressInputChange = (field, value) => {
    setAddressFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'country_code') {
        // Country swap invalidates the region — clear it and re-validate postcode.
        next.region_id = null;
        next.region = '';
        next.region_code = '';
        addrValidation.onCountryChange(value, next);
      }
      addrValidation.onLiveChange(field, value, next);
      return next;
    });
  };

  const handleSaveAddress = async () => {
    try {
      setAddressError('');
      setAddressSuccess('');

      // Whole-form validation in one call — same logic Checkout uses.
      const validationErrors = addrValidation.validateAll();
      if (Object.keys(validationErrors).length > 0) return;

      const addressInput = {
        firstname: addressFormData.firstname.trim(),
        lastname: addressFormData.lastname.trim(),
        street: addressFormData.street.filter(s => s.trim()).map(s => s.trim()),
        city: addressFormData.city.trim(),
        postcode: addressFormData.postcode.trim(),
        country_code: addressFormData.country_code,
        telephone: addressFormData.telephone.trim() || null,
        default_shipping: addressFormData.default_shipping,
        default_billing: addressFormData.default_billing
      };

      // Add region object if region_id is provided - this is required for US addresses
      if (addressFormData.region_id) {
        addressInput.region = {
          region_id: parseInt(addressFormData.region_id)
        };
      }

      if (addressEditMode === 'edit' && editingAddress) {
        await updateCustomerAddress({
          variables: {
            id: parseInt(editingAddress.id),
            input: addressInput
          }
        });
        setAddressSuccess('Address updated successfully!');
      } else {
        await createCustomerAddress({
          variables: { input: addressInput }
        });
        setAddressSuccess('Address created successfully!');
      }

      await refetchCustomerData();

      setTimeout(() => {
        setAddressSuccess('');
        handleCloseAddressModal();
      }, 2000);
    } catch (error) {
      console.error('Error saving address:', error);
      setAddressError(error.message || 'Failed to save address. Please try again.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      await deleteCustomerAddress({
        variables: { id: parseInt(addressId) }
      });

      await refetchCustomerData();
      setAddressSuccess('Address deleted successfully!');
      setTimeout(() => setAddressSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting address:', error);
      setAddressError(error.message || 'Failed to delete address. Please try again.');
      setTimeout(() => setAddressError(''), 5000);
    }
  };

  // Wishlist management functions
  const handleRemoveFromWishlist = async (wishlistId, wishlistItemId) => {
    try {
      setWishlistActionError('');
      setWishlistActionSuccess('');

      await removeProductsFromWishlist({
        variables: {
          wishlistId: wishlistId,
          wishlistItemsIds: [wishlistItemId]
        }
      });

      await refetchWishlist();
      setWishlistActionSuccess('Item removed from wishlist!');
      setTimeout(() => setWishlistActionSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      setWishlistActionError(error.message || 'Failed to remove item from wishlist.');
      setTimeout(() => setWishlistActionError(''), 5000);
    }
  };

  const handleReorder = async (order) => {
    setReorderError('');
    setReorderingId(order.id || order.number);
    try {
      const { data } = await reorderItems({ variables: { orderNumber: String(order.number) } });
      const errors = data?.reorderItems?.userInputErrors || [];
      if (errors.length > 0) {
        // Surface the first user-facing error (typically "product out of stock").
        setReorderError(errors.map((e) => e.message).join('; '));
      }
      if (data?.reorderItems?.cart) {
        await refetchCart();
        if (errors.length === 0 && openMiniCart) openMiniCart();
      }
    } catch (err) {
      setReorderError(err?.graphQLErrors?.[0]?.message || err?.message || 'Reorder failed. Please try again.');
    } finally {
      setReorderingId(null);
    }
  };

  const openOrderDetails = (order) => {
    const params = new URLSearchParams(location.search || '');
    params.set('tab', 'orders');
    params.set('order', order.number);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` });
  };

  const closeOrderDetails = () => {
    const params = new URLSearchParams(location.search || '');
    params.delete('order');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' });
  };

  const profileTab = (
    <ProfileTab
      customerError={customerError}
      customer={customerData?.customer || {}}
      user={user}
      ordersCount={ordersData?.customer?.orders?.total_count || 0}
      wishlistCount={wishlistData?.customer?.wishlists?.[0]?.items_count || 0}
      onEditProfile={handleEditProfile}
      onChangePassword={handleOpenChangePassword}
      onSelectTab={selectTab}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return profileTab;
      case 'addresses':
        return (
          <AddressBookTab
            addresses={customerData?.customer?.addresses || []}
            onEditAddress={handleOpenEditAddress}
            onAddAddress={handleOpenAddAddress}
            onDeleteAddress={handleDeleteAddress}
          />
        );
      case 'orders':
        return (
          <OrdersTab
            viewingOrderNumber={viewingOrderNumber}
            ordersData={ordersData}
            ordersLoading={ordersLoading}
            ordersError={ordersError}
            ordersPage={ordersPage}
            onPageChange={(p) => {
              setOrdersPage(p);
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            reorderingId={reorderingId}
            onOpenOrder={openOrderDetails}
            onReorder={handleReorder}
            onCloseOrder={closeOrderDetails}
          />
        );
      case 'wishlist':
        return (
          <WishlistTab
            wishlistData={wishlistData}
            wishlistLoading={wishlistLoading}
            wishlistError={wishlistError}
            wishlistPage={wishlistPage}
            onPageChange={(p) => {
              setWishlistPage(p);
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRemoveItem={handleRemoveFromWishlist}
          />
        );
      default:
        return profileTab;
    }
  };

  return (
    <div className="my-account-container">
      <div className="account-header">
        <div className="account-header-text">
          <h1>My Account</h1>
          <p>Welcome back, {customerData?.customer?.firstname || user.email}!</p>
        </div>
        <button type="button" className="logout-btn" onClick={logout} aria-label="Logout">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>

      <div className="account-content">
        <nav className="account-nav">
          <ul className="nav-tabs">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => selectTab(tab.id)}
                >
                  <span className="tab-label">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="account-main">
          {renderTabContent()}
        </main>
      </div>

      <EditProfileModal
        open={isEditProfileModalOpen}
        onCancel={handleCancelEdit}
        formData={editFormData}
        onFieldChange={handleInputChange}
        emailEditable={isEmailEditable}
        onToggleEmailEditable={setIsEmailEditable}
        onSave={handleSaveProfile}
      />
      <ChangePasswordModal
        open={isChangePasswordModalOpen}
        onClose={handleCloseChangePassword}
        data={passwordData}
        onChange={handlePasswordChange}
        onSubmit={handleChangePassword}
      />
      <AddressModal
        open={isAddressModalOpen}
        onClose={handleCloseAddressModal}
        editMode={addressEditMode}
        formData={addressFormData}
        onFieldChange={handleAddressInputChange}
        validation={addrValidation}
        countries={countriesData?.countries || []}
        availableRegions={availableRegions}
        optionalZipCountries={optionalZipCountries}
        onSave={handleSaveAddress}
      />

      {typeof document !== 'undefined' && document.getElementById('toast-stack') && (
        <>
          {renderToast(wishlistActionSuccess, () => setWishlistActionSuccess(''), 'success')}
          {renderToast(wishlistActionError, () => setWishlistActionError(''), 'error')}
          {renderToast(addressSuccess, () => setAddressSuccess(''), 'success')}
          {renderToast(addressError, () => setAddressError(''), 'error')}
          {renderToast(saveSuccess, () => setSaveSuccess(''), 'success')}
          {renderToast(saveError, () => setSaveError(''), 'error')}
          {renderToast(passwordSuccess, () => setPasswordSuccess(''), 'success')}
          {renderToast(passwordError, () => setPasswordError(''), 'error')}
          {renderToast(reorderError, () => setReorderError(''), 'error')}
        </>
      )}
    </div>
  );
};

// Lightweight helper for the action-level toasts above. Kept outside
// the component because it has no per-instance state.
function renderToast(message, onClose, kind) {
  if (!message || typeof document === 'undefined') return null;
  const target = document.getElementById('toast-stack');
  if (!target) return null;
  return createPortal(
    <div
      className={`wl-toast${kind === 'error' ? ' wl-toast--error' : ''}`}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      <span className="wl-toast-text">{message}</span>
      <button type="button" className="wl-toast-close" onClick={onClose} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    target
  );
}

export default MyAccount;