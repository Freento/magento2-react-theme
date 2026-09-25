import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Breadcrumbs from './components/layout/Breadcrumbs';
import MiniCart from './components/layout/MiniCart';
import MobileBottomNav from './components/layout/MobileBottomNav';
import WishlistToast from './components/ui/WishlistToast';
import CartErrorToast from './components/ui/CartErrorToast';
import CompareToast from './components/ui/CompareToast';
import EditorPageRoute from './components/ui/EditorPageRoute';
import ClientOnly from './components/ui/ClientOnly';
import { renderPage, useActiveDevices } from 'editor-core/renderer';
import * as defaultBlocks from 'editor-core/blocks';
import NewsletterForm from './components/layout/NewsletterForm';
import { useAuth } from './context/AuthContext';

const LoginModal          = lazy(() => import('./components/auth/LoginModal'));
const RegisterModal       = lazy(() => import('./components/auth/RegisterModal'));
const ForgotPasswordModal = lazy(() => import('./components/auth/ForgotPasswordModal'));

function AuthModals() {
  const { isLoginModalOpen, isRegisterModalOpen, isForgotModalOpen } = useAuth();
  const open = isLoginModalOpen || isRegisterModalOpen || isForgotModalOpen;
  return open ? (
    <Suspense fallback={null}>
      <LoginModal />
      <RegisterModal />
      <ForgotPasswordModal />
    </Suspense>
  ) : null;
}

const Category              = lazy(() => import('./components/catalog/Category'));
const MyAccount             = lazy(() => import('./components/account/MyAccount'));
const Search                = lazy(() => import('./components/search/Search'));
const ShoppingCart          = lazy(() => import('./components/cart/ShoppingCart'));
const ComparePage           = lazy(() => import('./components/catalog/ComparePage'));
const Checkout              = lazy(() => import('./components/checkout/Checkout'));
const CheckoutSuccess       = lazy(() => import('./components/checkout/CheckoutSuccess'));
const PayPalCancel          = lazy(() => import('./components/checkout/PayPalCancel'));
const PayPalReturn          = lazy(() => import('./components/checkout/PayPalReturn'));
const AuthNetCommunicator   = lazy(() => import('./components/checkout/AuthNetCommunicator'));

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
  const editorPages = initialData.editorPages || {};
  const footerData = initialData.footerData || null;
  const ssrHint = initialData.ssrHint || null;
  // Editor blocks placed on a route the storefront owns (a category, for now).
  // Only the current path's document travels in the response; the paths list
  // tells the catalog route which other URLs are worth fetching one for.
  const routeArea = initialData.routeArea || null;
  const routeAreaPaths = initialData.routeAreaPaths || EMPTY_PATHS;

  return (
    <div className="App max900:pb-16">
      <ScrollToTop />
      <ScrollbarWidthVar />
      <Header />
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
      <ClientOnly>
        <Footer footerData={footerData} ssrHint={ssrHint} />
      </ClientOnly>
      <MiniCart />
      <AuthModals />
      <MobileBottomNav />
      <WishlistToast />
      <CartErrorToast />
      <CompareToast />
      <div id="toast-stack" className="toast-stack" />
    </div>
  );
}
