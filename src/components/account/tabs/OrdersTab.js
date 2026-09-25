import React from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../ui/Pagination';
import ArrowLeftIcon from '../../ui/icons/ArrowLeftIcon';

const OrderDetail = ({ order, loading, viewingOrderNumber, onBack }) => {
  if (loading && !order) {
    return (
      <div className="account-section order-details-page flex flex-col gap-4 pointer-events-none" aria-busy="true" aria-live="polite">
        <span className="skeleton w-[120px] h-3 mb-5" />
        <div className="flex justify-between items-start gap-4 flex-wrap pb-5 mb-6 border-b border-line">
          <div>
            <span className="skeleton w-[50px] h-2.5" />
            <span className="skeleton w-[140px] h-5 mt-0.5" />
            <span className="skeleton w-[180px] h-3 mt-1" />
          </div>
          <span className="skeleton w-[90px] h-[26px] rounded-sm" />
        </div>
        <section className="px-[22px] py-5 bg-bg border border-line rounded">
          <span className="skeleton w-[60px] h-2.5 mb-1" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`oi-${i}`} className="flex justify-between items-center px-[18px] py-3.5 border-b border-line last:border-b-0 [transition:background-color_120ms_ease] hover:bg-surface gap-4 max768:px-3.5 max768:py-3 max480:flex-col max480:items-start max480:gap-2.5" aria-hidden="true">
              <div className="item-details">
                <span className="skeleton w-3/5 h-3.5" />
                <span className="skeleton w-2/5 h-[11px] mt-1.5" />
              </div>
              <span className="skeleton w-[60px] h-4 shrink-0" />
            </div>
          ))}
        </section>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <section key={`oc-${i}`} className="px-[22px] py-5 bg-bg border border-line rounded flex flex-col gap-2" aria-hidden="true">
              <span className="skeleton w-[60px] h-2.5 mb-1" />
              <span className="skeleton w-full h-3" />
              <span className="skeleton w-full h-3" />
              <span className="skeleton w-3/5 h-3" />
            </section>
          ))}
        </div>
        <section className="px-[22px] py-5 bg-bg border border-line rounded">
          <span className="skeleton w-[60px] h-2.5 mb-1" />
          <div className="grid gap-2">
            <span className="skeleton w-full h-3" />
            <span className="skeleton w-full h-3" />
            <span className="skeleton w-3/5 h-3" />
          </div>
        </section>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="account-section">
        <button type="button" className="co-back-link" onClick={onBack}>
          <ArrowLeftIcon /> Back to orders
        </button>
        <div className="empty-state">
          <p>Order #{viewingOrderNumber} not found in your account.</p>
        </div>
      </div>
    );
  }
  const currency = order.total?.grand_total?.currency;
  const fmt = (v) => `${currency === 'USD' ? '$' : ''}${Number(v || 0).toFixed(2)}${currency && currency !== 'USD' ? ` ${currency}` : ''}`;
  const couponCodes = (order.applied_coupons || []).map((c) => c?.code).filter(Boolean).join(', ');
  const discounts = (order.total?.discounts || []).filter((d) => Number(d?.amount?.value || 0) !== 0);
  const discountLabel = (d) => {
    const desc = d.label && d.label.toLowerCase() !== 'discount' ? d.label : couponCodes;
    return desc ? `Discount (${desc})` : 'Discount';
  };
  return (
    <div className="account-section order-details-page flex flex-col gap-4">
      <button type="button" className="co-back-link" onClick={onBack}>
        <ArrowLeftIcon /> Back to orders
      </button>
      <div className="flex justify-between items-start gap-4 flex-wrap pb-5 mb-6 border-b border-line">
        <div>
          <span className="inline-block text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Order</span>
          <h3 className="mt-0 mb-6 text-[20px] font-semibold tracking-[-0.01em] text-ink tabular-nums max768:hidden">#{order.number}</h3>
          <p className="mt-0.5 mb-0 text-sm text-ink-2">
            Placed {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
      </div>

      {order.items && order.items.length > 0 && (
        <section className="px-[22px] py-5 bg-bg border border-line rounded">
          <h4 className="mt-0 mb-3.5 text-2xs font-semibold tracking-[0.14em] uppercase text-ink-2">Items</h4>
          <div className="border border-line rounded overflow-hidden">
            {order.items.map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-center px-[18px] py-3.5 border-b border-line last:border-b-0 [transition:background-color_120ms_ease] hover:bg-surface gap-4 max768:px-3.5 max768:py-3 max480:flex-col max480:items-start max480:gap-2.5">
                <div className="item-details">
                  <h4 className="mt-0 mb-1 text-base font-semibold text-ink">{item.product_name}</h4>
                  <p className="my-0.5 text-sm text-ink-2">SKU: {item.product_sku}</p>
                  <p className="my-0.5 text-sm text-ink-2">Qty: {item.quantity_ordered}</p>
                </div>
                <div className="text-base font-semibold text-ink whitespace-nowrap max480:self-end">{fmt(item.product_sale_price?.value)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {order.shipping_address && (
          <section className="px-[22px] py-5 bg-bg border border-line rounded">
            <h4 className="mt-0 mb-3.5 text-2xs font-semibold tracking-[0.14em] uppercase text-ink-2">Shipping address</h4>
            <div className="address-details">
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2"><strong className="text-ink font-medium">{order.shipping_address.firstname} {order.shipping_address.lastname}</strong></p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.shipping_address.street?.join(', ')}</p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.shipping_address.city}, {order.shipping_address.region} {order.shipping_address.postcode}</p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.shipping_address.country_code}</p>
              {order.shipping_address.telephone && <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">Tel: {order.shipping_address.telephone}</p>}
            </div>
          </section>
        )}
        {order.billing_address && (
          <section className="px-[22px] py-5 bg-bg border border-line rounded">
            <h4 className="mt-0 mb-3.5 text-2xs font-semibold tracking-[0.14em] uppercase text-ink-2">Billing address</h4>
            <div className="address-details">
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2"><strong className="text-ink font-medium">{order.billing_address.firstname} {order.billing_address.lastname}</strong></p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.billing_address.street?.join(', ')}</p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.billing_address.city}, {order.billing_address.region} {order.billing_address.postcode}</p>
              <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">{order.billing_address.country_code}</p>
              {order.billing_address.telephone && <p className="m-0 mb-1 text-sm leading-[1.55] text-ink-2">Tel: {order.billing_address.telephone}</p>}
            </div>
          </section>
        )}
        {order.payment_methods && order.payment_methods.length > 0 && (
          <section className="px-[22px] py-5 bg-bg border border-line rounded">
            <h4 className="mt-0 mb-3.5 text-2xs font-semibold tracking-[0.14em] uppercase text-ink-2">Payment</h4>
            <div className="payment-details">
              {order.payment_methods.map((payment, index) => (
                <p key={index} className="my-[3px] text-[13px] leading-[1.5] text-ink-2"><strong className="text-ink font-medium">{payment.name}</strong>{payment.type ? ` (${payment.type})` : ''}</p>
              ))}
            </div>
          </section>
        )}
      </div>

      {order.total && (
        <section className="px-[22px] py-5 bg-bg border border-line rounded">
          <h4 className="mt-0 mb-3.5 text-2xs font-semibold tracking-[0.14em] uppercase text-ink-2">Totals</h4>
          <div className="grid gap-2">
            {order.total.subtotal && (
              <div className="flex justify-between items-baseline text-base text-ink tabular-nums"><span className="text-ink-2">Subtotal</span><span>{fmt(order.total.subtotal.value)}</span></div>
            )}
            {discounts.map((d, i) => (
              <div key={`disc-${i}`} className="flex justify-between items-baseline text-base text-ink tabular-nums">
                <span className="text-ink-2">{discountLabel(d)}</span>
                <span>−{fmt(Math.abs(d.amount?.value || 0))}</span>
              </div>
            ))}
            {order.total.total_shipping && (
              <div className="flex justify-between items-baseline text-base text-ink tabular-nums"><span className="text-ink-2">Shipping</span><span>{fmt(order.total.total_shipping.value)}</span></div>
            )}
            {order.total.total_tax && (
              <div className="flex justify-between items-baseline text-base text-ink tabular-nums"><span className="text-ink-2">Tax</span><span>{fmt(order.total.total_tax.value)}</span></div>
            )}
            <div className="flex justify-between items-baseline tabular-nums pt-2.5 mt-1 border-t border-line text-lg font-semibold tracking-[-0.01em] text-ink">
              <span>Grand total</span><span>{fmt(order.total.grand_total?.value)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// Orders tab — history table (with reorder + pagination) or, when a single
// order is being viewed via `?order=`, the order detail page. Extracted
// from MyAccount; state/handlers passed in.
const OrdersTab = ({
  viewingOrderNumber,
  ordersData,
  ordersLoading,
  ordersError,
  ordersPage,
  onPageChange,
  reorderingId,
  onOpenOrder,
  onReorder,
  onCloseOrder,
}) => {
  if (viewingOrderNumber) {
    const order = ordersData?.customer?.orders?.items?.find(
      (o) => String(o.number) === String(viewingOrderNumber)
    );
    return (
      <OrderDetail
        order={order}
        loading={ordersLoading}
        viewingOrderNumber={viewingOrderNumber}
        onBack={onCloseOrder}
      />
    );
  }

  return (
    <div className="account-section">
      {ordersLoading ? (
        <div className="w-full max768:overflow-x-auto max768:[-webkit-overflow-scrolling:touch]">
        <div className="grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr_auto] bg-bg border border-line rounded overflow-hidden mb-6 max768:min-w-[720px] pointer-events-none" aria-busy="true" aria-live="polite">
          <div className="contents" role="row" aria-hidden="true">
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Order #</span>
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Date</span>
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Ship to</span>
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Total</span>
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Status</span>
            <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2 text-right">Actions</span>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} className="contents" role="row" aria-hidden="true">
              <span role="cell" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0 tabular-nums">
                <span className="hidden">Order #</span>
                <span className="skeleton w-20 h-3.5 max768:w-[100px]" />
              </span>
              <span role="cell" className="p-4 border-t border-line text-sm flex items-center gap-2 min-w-0 text-ink-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <span className="hidden">Date</span>
                <span className="skeleton w-[90px] h-3 max768:w-[100px]" />
              </span>
              <span role="cell" className="p-4 border-t border-line text-sm flex items-center gap-2 min-w-0 text-ink-2 overflow-hidden text-ellipsis whitespace-nowrap">
                <span className="hidden">Ship to</span>
                <span className="skeleton w-[70%] h-3 max768:w-[140px]" />
              </span>
              <span role="cell" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0 tabular-nums font-semibold">
                <span className="hidden">Total</span>
                <span className="skeleton w-[60px] h-3.5 max768:w-[100px]" />
              </span>
              <span role="cell" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0">
                <span className="hidden">Status</span>
                <span className="skeleton w-[70px] h-[22px] rounded-sm max768:w-20 max768:h-5" />
              </span>
              <span role="cell" className="p-4 border-t border-line text-sm text-ink flex items-center min-w-0 justify-end gap-1">
                <span className="skeleton w-[38px] h-3 max768:w-[100px]" />
                <span className="text-ink-2 px-1 select-none" aria-hidden="true">·</span>
                <span className="skeleton w-[38px] h-3 max768:w-[100px]" />
              </span>
            </div>
          ))}
        </div>
        </div>
      ) : ordersError ? (
        <div className="bg-danger-bg border border-danger-border text-danger px-3.5 py-3 rounded mb-4 text-13 leading-[1.45]">Error loading orders: {ordersError.message}</div>
      ) : ordersData?.customer?.orders?.items?.length > 0 ? (
        <>
          <div className="w-full max768:overflow-x-auto max768:[-webkit-overflow-scrolling:touch]">
          <div className="grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr_auto] bg-bg border border-line rounded overflow-hidden mb-6 max768:min-w-[720px]" role="table" aria-label="Order history">
            <div className="contents" role="row">
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Order #</span>
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Date</span>
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Ship to</span>
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Total</span>
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2">Status</span>
              <span role="columnheader" className="px-4 py-3.5 bg-surface text-2xs font-medium tracking-eyebrow uppercase text-ink-2 text-right">Actions</span>
            </div>
            {ordersData.customer.orders.items.map((order) => {
              const ccy = order.total?.grand_total?.currency;
              const fmtTotal = ccy === 'USD'
                ? `$${Number(order.total?.grand_total?.value || 0).toFixed(2)}`
                : `${Number(order.total?.grand_total?.value || 0).toFixed(2)} ${ccy || ''}`.trim();
              const ship = order.shipping_address;
              const shipTo = ship
                ? `${ship.firstname || ''}${ship.lastname ? ' ' + ship.lastname : ''}`.trim() || '—'
                : '—';
              const busy = reorderingId === (order.id || order.number);
              return (
                <div key={order.id} className="contents" role="row">
                  <span role="cell" data-label="Order #" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0 tabular-nums">
                    <span className="hidden">Order #</span>
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 font-semibold tracking-[-0.005em] text-ink cursor-pointer underline decoration-line underline-offset-[3px] transition-colors duration-fast ease-[ease] hover:decoration-ink"
                      onClick={() => onOpenOrder(order)}
                    >
                      #{order.number}
                    </button>
                  </span>
                  <span role="cell" data-label="Date" className="p-4 border-t border-line text-sm flex items-center gap-2 min-w-0 text-ink-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="hidden">Date</span>
                    {new Date(order.order_date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                  <span role="cell" data-label="Ship to" className="p-4 border-t border-line text-sm flex items-center gap-2 min-w-0 text-ink-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    <span className="hidden">Ship to</span>
                    {shipTo}
                  </span>
                  <span role="cell" data-label="Total" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0 tabular-nums font-semibold">
                    <span className="hidden">Total</span>
                    {fmtTotal}
                  </span>
                  <span role="cell" data-label="Status" className="p-4 border-t border-line text-sm text-ink flex items-center gap-2 min-w-0">
                    <span className="hidden">Status</span>
                    <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                  </span>
                  <span role="cell" className="p-4 border-t border-line text-sm text-ink flex items-center min-w-0 justify-end gap-1">
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-sm font-medium text-ink cursor-pointer underline decoration-line underline-offset-[3px] transition-colors duration-fast ease-[ease] hover:decoration-ink disabled:text-ink-2 disabled:cursor-not-allowed"
                      onClick={() => onOpenOrder(order)}
                    >
                      View
                    </button>
                    <span aria-hidden="true" className="text-ink-2 px-1 select-none">·</span>
                    <button
                      type="button"
                      className="bg-transparent border-0 p-0 text-sm font-medium text-ink cursor-pointer underline decoration-line underline-offset-[3px] transition-colors duration-fast ease-[ease] hover:decoration-ink disabled:text-ink-2 disabled:cursor-not-allowed"
                      onClick={() => onReorder(order)}
                      disabled={busy}
                      aria-busy={busy}
                    >
                      {busy ? 'Adding…' : 'Reorder'}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
          </div>
          <Pagination
            currentPage={ordersData.customer.orders.page_info?.current_page || ordersPage}
            totalPages={ordersData.customer.orders.page_info?.total_pages || 1}
            onPageChange={onPageChange}
          />
        </>
      ) : (
        <div className="empty-state">
          <p>No orders found</p>
          <Link to="/" className="btn-primary">Continue Shopping</Link>
        </div>
      )}
    </div>
  );
};

export default OrdersTab;
