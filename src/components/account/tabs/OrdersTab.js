import React from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../ui/Pagination';

const OrderDetail = ({ order, loading, viewingOrderNumber, onBack }) => {
  if (loading && !order) {
    return (
      <div className="account-section order-details-page ma-skel" aria-busy="true" aria-live="polite">
        <span className="skeleton ma-skel-back" />
        <div className="order-details-head">
          <div>
            <span className="skeleton ma-skel-eyebrow" />
            <span className="skeleton ma-skel-order-num" />
            <span className="skeleton ma-skel-date" />
          </div>
          <span className="skeleton ma-skel-status" />
        </div>
        <section className="order-section">
          <span className="skeleton ma-skel-card-title" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`oi-${i}`} className="order-item" aria-hidden="true">
              <div className="item-details">
                <span className="skeleton ma-skel-item-name" />
                <span className="skeleton ma-skel-item-meta" />
              </div>
              <span className="skeleton ma-skel-item-price" />
            </div>
          ))}
        </section>
        <div className="order-details-cols">
          {Array.from({ length: 3 }).map((_, i) => (
            <section key={`oc-${i}`} className="order-section ma-skel-card" aria-hidden="true">
              <span className="skeleton ma-skel-card-title" />
              <span className="skeleton ma-skel-card-line" />
              <span className="skeleton ma-skel-card-line" />
              <span className="skeleton ma-skel-card-line ma-skel-card-line--short" />
            </section>
          ))}
        </div>
        <section className="order-section">
          <span className="skeleton ma-skel-card-title" />
          <div className="totals-grid">
            <span className="skeleton ma-skel-card-line" />
            <span className="skeleton ma-skel-card-line" />
            <span className="skeleton ma-skel-card-line ma-skel-card-line--short" />
          </div>
        </section>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="account-section">
        <button type="button" className="co-back-link" onClick={onBack}>
          ← Back to orders
        </button>
        <div className="empty-state">
          <p>Order #{viewingOrderNumber} not found in your account.</p>
        </div>
      </div>
    );
  }
  const currency = order.total?.grand_total?.currency;
  const fmt = (v) => `${currency === 'USD' ? '$' : ''}${Number(v || 0).toFixed(2)}${currency && currency !== 'USD' ? ` ${currency}` : ''}`;
  return (
    <div className="account-section order-details-page">
      <button type="button" className="co-back-link" onClick={onBack}>
        ← Back to orders
      </button>
      <div className="order-details-head">
        <div>
          <span className="order-eyebrow">Order</span>
          <h3 className="order-details-title">#{order.number}</h3>
          <p className="order-date">
            Placed {new Date(order.order_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
      </div>

      {order.items && order.items.length > 0 && (
        <section className="order-section">
          <h4 className="order-section-title">Items</h4>
          <div className="order-items">
            {order.items.map((item, index) => (
              <div key={item.id || index} className="order-item">
                <div className="item-details">
                  <h4>{item.product_name}</h4>
                  <p>SKU: {item.product_sku}</p>
                  <p>Qty: {item.quantity_ordered}</p>
                </div>
                <div className="item-price">{fmt(item.product_sale_price?.value)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="order-details-cols">
        {order.shipping_address && (
          <section className="order-section">
            <h4 className="order-section-title">Shipping address</h4>
            <div className="address-details">
              <p><strong>{order.shipping_address.firstname} {order.shipping_address.lastname}</strong></p>
              <p>{order.shipping_address.street?.join(', ')}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.region} {order.shipping_address.postcode}</p>
              <p>{order.shipping_address.country_code}</p>
              {order.shipping_address.telephone && <p>Tel: {order.shipping_address.telephone}</p>}
            </div>
          </section>
        )}
        {order.billing_address && (
          <section className="order-section">
            <h4 className="order-section-title">Billing address</h4>
            <div className="address-details">
              <p><strong>{order.billing_address.firstname} {order.billing_address.lastname}</strong></p>
              <p>{order.billing_address.street?.join(', ')}</p>
              <p>{order.billing_address.city}, {order.billing_address.region} {order.billing_address.postcode}</p>
              <p>{order.billing_address.country_code}</p>
              {order.billing_address.telephone && <p>Tel: {order.billing_address.telephone}</p>}
            </div>
          </section>
        )}
        {order.payment_methods && order.payment_methods.length > 0 && (
          <section className="order-section">
            <h4 className="order-section-title">Payment</h4>
            <div className="payment-details">
              {order.payment_methods.map((payment, index) => (
                <p key={index}><strong>{payment.name}</strong>{payment.type ? ` (${payment.type})` : ''}</p>
              ))}
            </div>
          </section>
        )}
      </div>

      {order.total && (
        <section className="order-section">
          <h4 className="order-section-title">Totals</h4>
          <div className="totals-grid">
            {order.total.subtotal && (
              <div className="total-row"><span>Subtotal</span><span>{fmt(order.total.subtotal.value)}</span></div>
            )}
            {order.total.total_shipping && (
              <div className="total-row"><span>Shipping</span><span>{fmt(order.total.total_shipping.value)}</span></div>
            )}
            {order.total.total_tax && (
              <div className="total-row"><span>Tax</span><span>{fmt(order.total.total_tax.value)}</span></div>
            )}
            <div className="total-row grand-total">
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
        <div className="orders-table-scroll">
        <div className="orders-table ma-skel" aria-busy="true" aria-live="polite">
          <div className="orders-table-head" role="row" aria-hidden="true">
            <span role="columnheader">Order #</span>
            <span role="columnheader">Date</span>
            <span role="columnheader">Ship to</span>
            <span role="columnheader">Total</span>
            <span role="columnheader">Status</span>
            <span role="columnheader" className="orders-col-actions">Actions</span>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} className="orders-row" role="row" aria-hidden="true">
              <span role="cell" className="orders-cell-num">
                <span className="orders-cell-label">Order #</span>
                <span className="skeleton ma-skel-orders-num" />
              </span>
              <span role="cell" className="orders-cell-date">
                <span className="orders-cell-label">Date</span>
                <span className="skeleton ma-skel-orders-date" />
              </span>
              <span role="cell" className="orders-cell-ship">
                <span className="orders-cell-label">Ship to</span>
                <span className="skeleton ma-skel-orders-ship" />
              </span>
              <span role="cell" className="orders-cell-total">
                <span className="orders-cell-label">Total</span>
                <span className="skeleton ma-skel-orders-total" />
              </span>
              <span role="cell" className="orders-cell-status">
                <span className="orders-cell-label">Status</span>
                <span className="skeleton ma-skel-orders-status" />
              </span>
              <span role="cell" className="orders-cell-actions">
                <span className="skeleton ma-skel-orders-action" />
                <span className="orders-action-sep" aria-hidden="true">·</span>
                <span className="skeleton ma-skel-orders-action" />
              </span>
            </div>
          ))}
        </div>
        </div>
      ) : ordersError ? (
        <div className="error-message">Error loading orders: {ordersError.message}</div>
      ) : ordersData?.customer?.orders?.items?.length > 0 ? (
        <>
          <div className="orders-table-scroll">
          <div className="orders-table" role="table" aria-label="Order history">
            <div className="orders-table-head" role="row">
              <span role="columnheader">Order #</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Ship to</span>
              <span role="columnheader">Total</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className="orders-col-actions">Actions</span>
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
                <div key={order.id} className="orders-row" role="row">
                  <span role="cell" data-label="Order #" className="orders-cell-num">
                    <span className="orders-cell-label">Order #</span>
                    <button
                      type="button"
                      className="orders-num-link"
                      onClick={() => onOpenOrder(order)}
                    >
                      #{order.number}
                    </button>
                  </span>
                  <span role="cell" data-label="Date" className="orders-cell-date">
                    <span className="orders-cell-label">Date</span>
                    {new Date(order.order_date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                  <span role="cell" data-label="Ship to" className="orders-cell-ship">
                    <span className="orders-cell-label">Ship to</span>
                    {shipTo}
                  </span>
                  <span role="cell" data-label="Total" className="orders-cell-total">
                    <span className="orders-cell-label">Total</span>
                    {fmtTotal}
                  </span>
                  <span role="cell" data-label="Status" className="orders-cell-status">
                    <span className="orders-cell-label">Status</span>
                    <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                  </span>
                  <span role="cell" className="orders-cell-actions">
                    <button
                      type="button"
                      className="orders-action-link"
                      onClick={() => onOpenOrder(order)}
                    >
                      View
                    </button>
                    <span aria-hidden="true" className="orders-action-sep">·</span>
                    <button
                      type="button"
                      className="orders-action-link orders-action-link--reorder"
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
