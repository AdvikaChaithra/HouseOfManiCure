import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag, X, ExternalLink, MessageCircle, CheckCircle2 } from 'lucide-react';
import { unitPrice, productCode } from '../utils/cart';
import { productImage, formatPrice } from '../utils/display';
import { useToast } from '../components/Toast';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, checkout } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const [notes, setNotes] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    pincode: ''
  });

  // The placed order, shown in the "tap Send in WhatsApp" confirmation
  const [placedOrder, setPlacedOrder] = useState(null);

  const updateField = (field) => (e) => setCheckoutData(prev => ({ ...prev, [field]: e.target.value }));

  const handleConfirm = (e) => {
    e.preventDefault();
    const { name, phone, address, pincode } = checkoutData;
    if (!name.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      toast('Please fill in all delivery details.', 'error');
      return;
    }
    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      toast('Please enter a valid 6-digit pincode.', 'error');
      return;
    }
    setShowCheckout(false);

    // Opens WhatsApp with the full order already typed; the customer taps Send
    const order = checkout(notes, checkoutData);
    if (!order) return;
    setNotes('');
    setPlacedOrder(order);
  };

  const orderSentModal = placedOrder && (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label="Order ready in WhatsApp">
        <button type="button" className="icon-btn modal-close" aria-label="Close" onClick={() => setPlacedOrder(null)}>
          <X size={18} />
        </button>
        <div className="empty-state-icon" style={{ margin: '0 0 1.25rem', background: '#e7f4ec', color: 'var(--whatsapp)' }}>
          <CheckCircle2 size={28} />
        </div>
        <span className="eyebrow">Order {placedOrder.orderNumber}</span>
        <h2>Just tap Send in WhatsApp</h2>
        <p className="modal-sub">
          WhatsApp has opened with your full order already typed. Tap <strong>Send</strong> to place it.
          Your PDF receipt is downloading for your records{placedOrder.needsPhotos ? ' — please attach it in the chat so we get your hand photos' : ''}.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={() => setPlacedOrder(null)}>Done</button>
          <a href={placedOrder.waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <MessageCircle size={17} /> Open WhatsApp again <ExternalLink size={14} />
          </a>
        </div>
        <p className="summary-fineprint">WhatsApp didn't open? Use the green button above.</p>
      </div>
    </div>
  );

  if (cart.length === 0) {
    return (
      <div className="page">
        {orderSentModal}
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingBag size={26} /></div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any nails yet. Find a set you love.</p>
          <Link to="/shop" className="btn btn-primary">Start shopping</Link>
        </div>
      </div>
    );
  }

  const total = getCartTotal();
  const itemCount = cart.reduce((n, item) => n + item.quantity, 0);

  return (
    <div className="page">
      <div className="container">
        <div className="page-head" style={{ textAlign: 'left', margin: '0 0 2.5rem', maxWidth: 'none' }}>
          <h1>Your cart</h1>
          <p>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
        </div>

        <div className="cart-layout">
          <div className="cart-list">
            {cart.map((item, index) => {
              const price = unitPrice(item);
              const isCustom = item.size?.type === 'Custom';
              return (
                <div key={index} className="cart-item">
                  <img className="cart-item-img" src={productImage(item, item.color)} alt={item.name} />

                  <div>
                    <h3 className="cart-item-name">{item.name}</h3>
                    <div className="cart-item-meta">
                      <span>Code: <strong>{productCode(item)}</strong></span>
                      <span>Colour: <strong>{item.color}</strong></span>
                      <span>Shape: <strong>{item.shape || 'Standard'}</strong></span>
                      <span>Size: <strong>{isCustom ? 'Custom' : item.size}</strong></span>
                    </div>

                    {isCustom && (
                      <div className="cart-item-custom">
                        {item.size.images && item.size.images.length > 0 ? (
                          <>
                            {item.size.images.map((img, i) => (
                              <span key={i} className="mini-thumb" style={{ backgroundImage: `url("${img}")` }} />
                            ))}
                            <span>{item.size.images.length} photo{item.size.images.length > 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          item.size.measurements && Object.entries(item.size.measurements).map(([finger, mm]) => (
                            <span key={finger}><strong style={{ textTransform: 'capitalize' }}>{finger}</strong> {mm}mm</span>
                          ))
                        )}
                      </div>
                    )}

                    {item.customizations && <p className="cart-item-note">“{item.customizations}”</p>}

                    <div className="cart-item-controls">
                      <div className="qty">
                        <button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(index, -1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(index, 1)}><Plus size={14} /></button>
                      </div>
                      <button type="button" className="link-btn danger" onClick={() => removeFromCart(index)}>
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-side">
                    <span className="cart-item-total">{formatPrice(price * item.quantity)}</span>
                    <span className="cart-item-unit">
                      {formatPrice(price)} each
                      {item.discount > 0 && <> · <span className="price-old">{formatPrice(item.price)}</span></>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="summary">
            <h3>Order summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>Confirmed on WhatsApp</span></div>
            <div className="summary-total"><span>Estimated total</span><span>{formatPrice(total)}</span></div>

            <div className="form-group">
              <label className="form-label" htmlFor="order-notes">Notes for us (optional)</label>
              <textarea
                id="order-notes"
                className="form-input"
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery instructions, occasion date…"
              />
            </div>

            <button onClick={() => setShowCheckout(true)} className="btn btn-whatsapp btn-block">
              <MessageCircle size={18} /> Place order on WhatsApp
            </button>
            <p className="summary-fineprint">
              WhatsApp opens with your full order already typed — just tap Send. We'll confirm it there and share the payment QR code.
            </p>
          </aside>
        </div>
      </div>

      {orderSentModal}

      {showCheckout && (
        <div className="modal-backdrop" onClick={() => setShowCheckout(false)}>
          <form className="modal" role="dialog" aria-label="Confirm delivery details" onClick={e => e.stopPropagation()} onSubmit={handleConfirm}>
            <button type="button" className="icon-btn modal-close" aria-label="Close" onClick={() => setShowCheckout(false)}>
              <X size={18} />
            </button>
            <h2>Delivery details</h2>
            <p className="modal-sub">Please confirm where we should send your nails.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="co-name">Full name</label>
              <input id="co-name" type="text" className="form-input" value={checkoutData.name} onChange={updateField('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="co-phone">Phone number</label>
              <input id="co-phone" type="tel" className="form-input" value={checkoutData.phone} onChange={updateField('phone')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="co-address">Street address</label>
              <textarea id="co-address" className="form-input" rows="2" value={checkoutData.address} onChange={updateField('address')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="co-pin">Pincode</label>
              <input id="co-pin" type="text" inputMode="numeric" maxLength={6} className="form-input" value={checkoutData.pincode} onChange={updateField('pincode')} required />
            </div>

            <div className="modal-actions">
              <button type="button" onClick={() => setShowCheckout(false)} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-whatsapp">Continue to WhatsApp</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Cart;
