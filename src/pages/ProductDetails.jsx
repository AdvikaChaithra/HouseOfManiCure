import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ArrowLeft, Plus, Minus, Search, X, Upload, Check, Truck } from 'lucide-react';
// import { MessageCircle } from 'lucide-react'; // WhatsApp button icon (disabled)
// import { ADMIN_WHATSAPP } from '../api'; // WhatsApp (disabled)
import InstagramIcon from '../components/InstagramIcon';
import { instagramDmUrl, copyText } from '../utils/instagram';
import { isSameLine, unitPrice, productCode } from '../utils/cart';
import { imageSrc, productImage, swatchColor, formatPrice } from '../utils/display';
import { useToast } from '../components/Toast';

const MAX_SIZE_IMAGES = 5;
const SIZES = ['S', 'M', 'L', 'Custom'];
const FINGERS = ['thumb', 'index', 'middle', 'ring', 'little'];

const ProductDetails = () => {
  const { id } = useParams();
  const { products, loading } = useStore();

  if (loading) return null;

  const product = products.find(p => p.id === id);
  if (!product) return <Navigate to="/shop" replace />;

  // key resets all selections when navigating to a different product
  return <ProductView key={product.id} product={product} />;
};

const ProductView = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { shapes } = useStore();
  const { cart, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();

  const colors = product.colors || [];
  const [selectedColor, setSelectedColor] = useState(colors[0] || '');
  const [selectedShape, setSelectedShape] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [customSizes, setCustomSizes] = useState({ thumb: '', index: '', middle: '', ring: '', little: '' });
  const [customSizeImages, setCustomSizeImages] = useState([]);
  const [customizations, setCustomizations] = useState('');
  const [added, setAdded] = useState(false);
  const [enlargedShape, setEnlargedShape] = useState(null);

  const hasShapes = shapes && shapes.length > 0;
  const hasDiscount = product.discount > 0;
  const imageUrl = productImage(product, selectedColor);

  // One thumbnail per colour, shown only when colours have their own photos
  const colorThumbs = colors.map(color => ({ color, src: productImage(product, color) }));
  const showThumbs = new Set(colorThumbs.map(t => t.src)).size > 1;

  const sizeData = selectedSize === 'Custom'
    ? { type: 'Custom', measurements: customSizes, images: customSizeImages }
    : selectedSize;

  const cartItemIndex = cart.findIndex(item =>
    isSameLine(item, { id: product.id, color: selectedColor, customizations, shape: selectedShape, size: sizeData })
  );
  const cartItem = cartItemIndex >= 0 ? cart[cartItemIndex] : null;

  const handleAddToCart = () => {
    if (!user) {
      // Come back to this product after logging in
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (hasShapes && !selectedShape) {
      toast('Please select a nail shape.', 'error');
      return;
    }

    if (!selectedSize) {
      toast('Please select a nail size.', 'error');
      return;
    }

    if (selectedSize === 'Custom') {
      const hasAllSizes = Object.values(customSizes).every(v => v !== '' && Number(v) > 0);
      if (!hasAllSizes && customSizeImages.length === 0) {
        toast('For a custom size, add all 5 measurements or upload a hand photo.', 'error');
        return;
      }
    }

    addToCart(product, 1, selectedColor, customizations, sizeData, selectedShape);
    toast(`${product.name} added to your cart`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // --- WhatsApp (disabled for now) ---
  // const handleWhatsAppInquiry = () => {
  //   const text = encodeURIComponent(`Hi, I'm interested in customizing the ${product.name} design. Can we discuss some ideas?`);
  //   window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, '_blank');
  // };

  // Open the Instagram chat with the message; it is also copied in case Instagram doesn't fill it
  const handleInstagramInquiry = () => {
    const parts = [`Hi! I'm interested in customising the "${product.name}" design.`];
    if (selectedColor) parts.push(`Colour: ${selectedColor}.`);
    if (selectedShape) parts.push(`Shape: ${selectedShape}.`);
    if (customizations.trim()) parts.push(`My idea: ${customizations.trim()}`);
    parts.push('Can we discuss it?');
    const message = parts.join(' ');
    copyText(message).then(ok => {
      if (ok) toast('Message copied. Paste it in the Instagram chat.', 'success');
    });
    // Asks Instagram to pre-type the message (works only in some app versions)
    window.open(instagramDmUrl(message), '_blank', 'noopener');
  };

  const handleSizePhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const availableSlots = MAX_SIZE_IMAGES - customSizeImages.length;
    const filesToProcess = files.slice(0, availableSlots);
    // Reset so the same file can be picked again after removing it
    e.target.value = '';

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        // Re-check the limit: several reads finish asynchronously
        setCustomSizeImages(prev => prev.length >= MAX_SIZE_IMAGES ? prev : [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const photosFull = customSizeImages.length >= MAX_SIZE_IMAGES;

  return (
    <div className="page">
      <div className="container">
        <button onClick={() => navigate(-1)} className="back-link">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="pd">
          {/* Images */}
          <div className="pd-media">
            <img className="pd-main-img" src={imageUrl} alt={`${product.name}${selectedColor ? ` in ${selectedColor}` : ''}`} />
            {showThumbs && (
              <div className="pd-thumbs">
                {colorThumbs.map(t => (
                  <button
                    key={t.color}
                    type="button"
                    className={`pd-thumb ${selectedColor === t.color ? 'is-active' : ''}`}
                    onClick={() => setSelectedColor(t.color)}
                    aria-label={`Show ${t.color}`}>
                    <img src={t.src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {hasDiscount && <span className="badge">{product.discount}% off</span>}
            <h1 className="pd-title">{product.name}</h1>
            <p className="pd-code">Design code <strong>{productCode(product)}</strong></p>
            <div className="pd-price">
              <span className="price">{formatPrice(unitPrice(product))}</span>
              {hasDiscount && <span className="price-old">{formatPrice(product.price)}</span>}
            </div>
            <p className="pd-desc">{product.description}</p>

            {/* Colour */}
            {colors.length > 0 && (
              <div className="option-group">
                <div className="option-label">Colour <span>{selectedColor}</span></div>
                <div className="chips">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`chip ${selectedColor === color ? 'is-active' : ''}`}
                      onClick={() => setSelectedColor(color)}>
                      <span className="swatch" style={{ background: swatchColor(color) }} />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Shape */}
            <div className="option-group">
              <div className="option-label">
                Shape {hasShapes && <span>{selectedShape || 'Required'}</span>}
              </div>
              {!hasShapes ? (
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>No shapes currently available.</p>
              ) : (
                <div className="shape-grid">
                  {shapes.map(shape => {
                    const sImg = imageSrc(shape.image);
                    const active = selectedShape === shape.name;
                    return (
                      <div
                        key={shape.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        className={`shape-option ${active ? 'is-active' : ''}`}
                        onClick={() => setSelectedShape(shape.name)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedShape(shape.name); } }}>
                        <button
                          type="button"
                          className="shape-zoom"
                          aria-label={`Preview ${shape.name} shape`}
                          onClick={(e) => { e.stopPropagation(); setEnlargedShape({ src: sImg, name: shape.name }); }}>
                          <Search size={13} />
                        </button>
                        <div className="shape-option-img" style={{ backgroundImage: `url("${sImg}")` }} />
                        <span className="shape-option-name">{shape.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Size */}
            <div className="option-group">
              <div className="option-label">Size <span>{selectedSize || 'Required'}</span></div>
              <div className="chips">
                {SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`chip ${selectedSize === size ? 'is-active' : ''}`}
                    onClick={() => setSelectedSize(size)}>
                    {size}
                  </button>
                ))}
              </div>

              {selectedSize === 'Custom' && (
                <div className="custom-size">
                  <p>
                    Enter the width of each nail in mm, <strong>or</strong> upload a clear photo of each finger
                    laid flat with a ₹1 coin beside it for scale.
                  </p>

                  <div className="finger-grid">
                    {FINGERS.map(finger => (
                      <div key={finger}>
                        <label htmlFor={`finger-${finger}`}>{finger}</label>
                        <input
                          id={`finger-${finger}`}
                          type="number"
                          min="1"
                          step="0.1"
                          placeholder="mm"
                          className="form-input"
                          value={customSizes[finger]}
                          onChange={e => setCustomSizes(prev => ({ ...prev, [finger]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="or-divider">OR</div>

                  <label className={`upload-btn ${photosFull ? 'is-disabled' : ''}`}>
                    <Upload size={17} />
                    {photosFull ? 'Maximum 5 photos added' : 'Upload hand photos (with ₹1 coin)'}
                    <input type="file" accept="image/*" multiple disabled={photosFull} onChange={handleSizePhotos} hidden />
                  </label>
                  <p className="form-hint" style={{ textAlign: 'center' }}>{customSizeImages.length}/{MAX_SIZE_IMAGES} photos</p>

                  {customSizeImages.length > 0 && (
                    <div className="thumb-list">
                      {customSizeImages.map((imgSrc, idx) => (
                        <div key={idx} className="thumb" style={{ backgroundImage: `url("${imgSrc}")` }}>
                          <button
                            type="button"
                            className="thumb-remove"
                            aria-label="Remove photo"
                            onClick={() => setCustomSizeImages(prev => prev.filter((_, i) => i !== idx))}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="option-group">
              <label className="option-label" htmlFor="customizations">Customisation <span>Optional</span></label>
              <textarea
                id="customizations"
                className="form-input"
                placeholder="E.g. a heart on the ring finger, 2mm shorter length…"
                rows="3"
                value={customizations}
                onChange={(e) => setCustomizations(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="pd-actions">
              {cartItem ? (
                <div className="qty qty-lg">
                  <button type="button" aria-label="Decrease quantity" onClick={() => updateQuantity(cartItemIndex, -1)}><Minus size={16} /></button>
                  <span>{cartItem.quantity} in cart</span>
                  <button type="button" aria-label="Increase quantity" onClick={() => updateQuantity(cartItemIndex, 1)}><Plus size={16} /></button>
                </div>
              ) : (
                <button onClick={handleAddToCart} className="btn btn-primary" disabled={added}>
                  {added ? <><Check size={18} /> Added</> : <><ShoppingBag size={18} /> Add to cart</>}
                </button>
              )}
              {/* <button onClick={handleWhatsAppInquiry} className="btn btn-whatsapp-outline">
                <MessageCircle size={18} /> Discuss a design
              </button> */}
              <button onClick={handleInstagramInquiry} className="btn btn-instagram-outline">
                <InstagramIcon size={18} /> Discuss a design
              </button>
            </div>
            <p className="pd-note"><Truck size={15} /> Orders and shipping are confirmed with you on WhatsApp.</p>
          </div>
        </div>
      </div>

      {enlargedShape && (
        <div className="modal-backdrop" onClick={() => setEnlargedShape(null)}>
          <div className="modal" role="dialog" aria-label={`${enlargedShape.name} shape preview`} onClick={e => e.stopPropagation()}>
            <button className="icon-btn modal-close" aria-label="Close" onClick={() => setEnlargedShape(null)}>
              <X size={18} />
            </button>
            <h2>{enlargedShape.name}</h2>
            <p className="modal-sub">Shape preview</p>
            <div className="shape-preview" style={{ backgroundImage: `url("${enlargedShape.src}")` }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
