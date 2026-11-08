import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

import { ADMIN_WHATSAPP } from '../api';
import { unitPrice, isSameLine, productCode, makeOrderNumber } from '../utils/cart';
import { useToast } from '../components/Toast';

const CartContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);

const cartKey = (user) => (user ? `nails_cart_${user.id}` : null);

const loadCart = (user) => {
  const key = cartKey(user);
  if (!key) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const toast = useToast();
  // Each user has their own cart, saved across page reloads.
  const [cart, setCart] = useState(() => loadCart(user));
  const [cartOwner, setCartOwner] = useState(user?.id ?? null);

  // When the logged-in user changes, switch to that user's cart
  // (otherwise the previous user's items would leak into the next account).
  const currentOwner = user?.id ?? null;
  if (cartOwner !== currentOwner) {
    setCartOwner(currentOwner);
    setCart(loadCart(user));
  }

  useEffect(() => {
    const key = cartKey(user);
    if (!key || cartOwner !== user.id) return;
    try {
      localStorage.setItem(key, JSON.stringify(cart));
    } catch (err) {
      // Custom-size photos can exceed the storage quota; the cart still works in memory.
      console.warn("Could not save cart:", err);
    }
  }, [cart, user, cartOwner]);
  
  // Builds the order message that appears pre-typed in WhatsApp.
  // WhatsApp shows *text* in bold.
  const buildOrderMessage = (customer, items, notes, orderNumber) => {
    const lines = [];
    let total = 0;
    let needsPhotos = false;
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);

    lines.push(`*NEW ORDER ${orderNumber}*`);
    lines.push(`Haus of ManiCure · ${itemCount} set${itemCount === 1 ? '' : 's'}`);
    lines.push('');

    items.forEach((item, index) => {
      const price = unitPrice(item);
      total += price * item.quantity;

      lines.push(`*${index + 1}) ${item.name}*`);
      lines.push(`• Design code: ${productCode(item)}`);
      lines.push(`• Colour: ${item.color || '-'}`);
      lines.push(`• Shape: ${item.shape || 'Standard'}`);

      if (item.size?.type === 'Custom') {
        const m = item.size.measurements || {};
        const hasMeasurements = Object.values(m).some(Boolean);
        const photoCount = item.size.images?.length || 0;
        if (hasMeasurements) {
          lines.push(`• Size: Custom (mm) – Thumb ${m.thumb || '-'}, Index ${m.index || '-'}, Middle ${m.middle || '-'}, Ring ${m.ring || '-'}, Little ${m.little || '-'}`);
        } else {
          lines.push(`• Size: Custom – ${photoCount} hand photo${photoCount === 1 ? '' : 's'} (in the PDF receipt)`);
        }
        if (photoCount > 0) needsPhotos = true;
      } else {
        lines.push(`• Size: ${item.size || '-'}`);
      }

      if (item.customizations) lines.push(`• Customisation: ${item.customizations}`);
      lines.push(`• Qty: ${item.quantity} × ₹${price.toFixed(2)} = ₹${(price * item.quantity).toFixed(2)}`);
      lines.push('');
    });

    lines.push(`*TOTAL: ₹${total.toFixed(2)}* (shipping to be confirmed)`);
    lines.push('');
    lines.push('*DELIVER TO*');
    lines.push(customer.name);
    lines.push(`Phone: ${customer.phone}`);
    lines.push(`${customer.address}${customer.pincode ? ` – ${customer.pincode}` : ''}`);

    if (notes && notes.trim()) {
      lines.push('');
      lines.push(`*NOTES:* ${notes.trim()}`);
    }

    lines.push('');
    if (needsPhotos) lines.push(`I'll attach the PDF receipt with my hand-size photos in this chat.`);
    lines.push('Please confirm my order and share the payment QR. Thank you!');

    return { text: lines.join('\n'), total, needsPhotos, orderNumber };
  };

  // WhatsApp checkout: builds the order message, downloads the PDF receipt,
  // opens WhatsApp with the message already typed (the customer just taps Send)
  // and empties the cart. Must be called directly from a click/submit so the
  // browser allows the new WhatsApp tab.
  const checkout = (customMessage = "", checkoutData = null) => {
    if (!user || cart.length === 0) return null;

    const customer = checkoutData || user;
    const orderItems = [...cart];
    const orderNumber = makeOrderNumber();
    const order = buildOrderMessage(customer, orderItems, customMessage, orderNumber);
    const waUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(order.text)}`;

    // jsPDF is large, so it is loaded only when an order is placed.
    const pdfDone = import('../utils/pdfGenerator')
      .then(({ generateOrderPDF }) =>
        generateOrderPDF(customer, orderItems, order.total, { orderNumber, notes: customMessage }))
      .catch(err => {
        console.error("PDF generation failed:", err);
        toast('The PDF receipt could not be created, but your order is ready in WhatsApp.', 'error');
      });

    // Open WhatsApp right away (synchronously) so popup blockers allow it
    const waWindow = window.open(waUrl, '_blank');
    if (!waWindow) {
      // Popup blocked: leave the page only after the PDF has downloaded.
      pdfDone.finally(() => { window.location.href = waUrl; });
    }

    setCart([]);
    return { ...order, waUrl };
  };

  const addToCart = (product, quantity = 1, color, customizations = "", size, shape) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item =>
        isSameLine(item, { id: product.id, color, customizations, shape, size })
      );
      
      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx] = { ...newCart[existingIdx], quantity: newCart[existingIdx].quantity + quantity };
        return newCart;
      }
      
      return [...prev, { ...product, quantity, color, customizations, size, shape }];
    });
  };

  const removeFromCart = (indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };
  
  const updateQuantity = (index, delta) => {
    setCart(prev => {
      if (!prev[index]) return prev;
      const newCart = [...prev];
      const newQuantity = Math.max(1, newCart[index].quantity + delta);
      newCart[index] = { ...newCart[index], quantity: newQuantity };
      return newCart;
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + unitPrice(item) * item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      checkout,
      getCartTotal,
      cartCount: cart.reduce((count, item) => count + item.quantity, 0)
    }}>
      {children}
    </CartContext.Provider>
  );
};
