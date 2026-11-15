import React, { useEffect, useCallback, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Breadcrumbs from './components/layout/Breadcrumbs';
import MiniCart from './components/layout/MiniCart';
import MobileBottomNav from './components/layout/MobileBottomNav';
import WishlistToast from './components/ui/WishlistToast';
import CartErrorToast from './components/ui/CartErrorToast';
import CartAttentionModal from './components/ui/CartAttentionModal';
import CompareToast from './components/ui/CompareToast';
import RefreshNotice from './components/ui/RefreshNotice';
import { lazyWithNotice } from './lib/chunkLoad';
import EditorPageRoute from './components/ui/EditorPageRoute';
import MaintenancePage from './components/ui/MaintenancePage';
import { renderPage, useActiveDevices } from 'editor-core/renderer';
import * as defaultBlocks from 'editor-core/blocks';
import NewsletterForm from './components/layout/NewsletterForm';
import { menuItemsOf } from './components/layout/Menu/menuItems';
import { useAuth } from './context/AuthContext';
import useBackToClose from './hooks/useBackToClose';

const LoginModal          = lazyWithNotice(() => import('./components/auth/LoginModal'));
const RegisterModal       = lazyWithNotice(() => import('./components/auth/RegisterModal'));
const ForgotPasswordModal = lazyWithNotice(() => import('./components/auth/ForgotPasswordModal'));

function AuthModals() {
  const {
    isLoginModalOpen, isRegisterModalOpen, isForgotModalOpen,
    openLoginModal, closeLoginModal, openRegisterModal, closeRegisterModal,
    openForgotModal, closeForgotModal,
  } = useAuth();
  useBackToClose('login', isLoginModalOpen, closeLoginModal, openLoginModal);
  useBackToClose('register', isRegisterModalOpen, closeRegisterModal, openRegisterModal);
  useBackToClose('forgot', isForgotModalOpen, closeForgotModal, openForgotModal);
  const open = isLoginModalOpen || isRegisterModalOpen || isForgotModalOpen;
  return open ? (
    <Suspense fallback={null}>
      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
    </Suspense>
  ) : null;
}

const Category              = lazyWithNotice(() => import('./components/catalog/Category'));
const MyAccount             = lazyWithNotice(() => import('./components/account/MyAccount'));
const Search                = lazyWithNotice(() => import('./components/search/Search'));
const ShoppingCart          = lazyWithNotice(() => import('./components/cart/ShoppingCart'));
const ComparePage           = lazyWithNotice(() => import('./components/catalog/ComparePage'));
const Checkout              = lazyWithNotice(() => import('./components/checkout/Checkout'));
const CheckoutSuccess       = lazyWithNotice(() => import('./components/checkout/CheckoutSuccess'));
const PayPalCancel          = lazyWithNotice(() => import('./components/checkout/PayPalCancel'));
const PayPalReturn          = lazyWithNotice(() => import('./components/checkout/PayPalReturn'));
const AuthNetCommunicator   = lazyWithNotice(() => import('./components/checkout/AuthNetCommunicator'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ScrollbarWidthVar() {
  useEffect(() => {
    const set = () => {
      const sw = window.innerWidth - document.documentElement.clientWidth;
      const root = document.documentElement;
      root.style.setProperty('--sw', `${Math.max(0, sw)}px`);
      root.style.setProperty('--fbw', `calc(100vw - ${Math.max(0, sw)}px)`);
    };
    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);
  return null;
}

const footerBlocks = { ...defaultBlocks, NewsletterForm };
const EMPTY_PATHS = [];

function Footer({ footerData, ssrHint }) {
  const devices = useActiveDevices(undefined, ssrHint);
  if (!footerData) return null;
  return renderPage(footerData, { devices, blocks: footerBlocks });
}

export default function App({ initialData = {} }) {
  if (initialData.maintenance) {
    return (
      <>
        <ScrollbarWidthVar />
        <MaintenancePage page={initialData.maintenancePage} ssrHint={initialData.ssrHint || null} />
      </>
    );
  }
  return <StoreApp initialData={initialData} />;
}

function StoreApp({ initialData = {} }) {
  const editorPages = initialData.editorPages || {};
  const footerData = initialData.footerData || null;
  const menuData = initialData.menuData || null;
  const ssrHint = initialData.ssrHint || null;
  // Editor blocks placed on a route the storefront owns (a category, for now).
  // Only the current path's document travels in the response; the paths list
  // tells the catalog route which other URLs are worth fetching one for.
  const routeArea = initialData.routeArea || null;
  const routeAreaPaths = initialData.routeAreaPaths || EMPTY_PATHS;
  const navigate = useNavigate();

  // Editor-rendered links (footer, CMS pages) are plain <a> tags — intercept
  // same-origin clicks and route them through React Router so they don't do a
  // full page reload. External links (target=_blank), downloads, hash-only and
  // modified clicks fall through to the browser. Links that already handle their
  // own navigation (router <Link>) set defaultPrevented first, so we skip them.
  const handleInternalNav = useCallback((e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const target = a.getAttribute('target');
    if ((target && target !== '_self') || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    // Same-page hash links: let the browser handle the anchor jump.
    if (url.pathname === window.location.pathname && url.hash) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  }, [navigate]);

  return (
    <div className="App max900:pb-16" onClick={handleInternalNav}>
      <ScrollToTop />
      <ScrollbarWidthVar />
      <Header menuItems={menuItemsOf(menuData)} />
      <main>
        <Breadcrumbs />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<EditorPageRoute slug="home" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/about" element={<EditorPageRoute slug="about" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/contact" element={<EditorPageRoute slug="contact" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/privacy-policy" element={<EditorPageRoute slug="privacy-policy" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/returns-refunds" element={<EditorPageRoute slug="returns-refunds" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/shipping-delivery" element={<EditorPageRoute slug="shipping-delivery" editorPages={editorPages} ssrHint={ssrHint} />} />
          <Route path="/terms-of-service" element={<EditorPageRoute slug="terms-of-service" editorPages={editorPages} ssrHint={ssrHint} />} />

          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/my-account/*" element={<MyAccount />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/compare" element={<ComparePage />} />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/paypal/cancel" element={<PayPalCancel />} />
          <Route path="/checkout/paypal/return" element={<PayPalReturn />} />
          <Route path="/paypal/cancel" element={<PayPalCancel />} />
          <Route path="/paypal/return" element={<PayPalReturn />} />

          <Route path="/authnetcim/hosted/communicator" element={<AuthNetCommunicator />} />

          <Route
            path="/*"
            element={<Category routeArea={routeArea} routeAreaPaths={routeAreaPaths} ssrHint={ssrHint} />}
          />
        </Routes>
        </Suspense>
      </main>
      <Footer footerData={footerData} ssrHint={ssrHint} />
      <MiniCart />
      <AuthModals />
      <MobileBottomNav />
      <WishlistToast />
      <CartErrorToast />
      <CartAttentionModal />
      <CompareToast />
      <RefreshNotice />
      <div id="toast-stack" className="toast-stack" />
    </div>
  );
}
