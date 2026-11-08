import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Package, Tag, Trash2, Plus, Image as ImageIcon, X, Pencil, Scissors } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { imageSrc, formatPrice } from '../../utils/display';
import { productCode } from '../../utils/cart';

const EMPTY_PRODUCT = { name: '', code: '', price: '', discount: '0', description: '' };

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('products');
  const { products, deals, shapes, createProduct, modifyProduct, removeProduct, createDeal, removeDeal, createShape, removeShape } = useStore();
  const toast = useToast();
  // Changing these keys clears the (uncontrolled) file inputs after a submit
  const [dealFileKey, setDealFileKey] = useState(0);
  const [shapeFileKey, setShapeFileKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Runs a save action, showing storage/other errors instead of failing silently
  const runSave = async (action, successMessage) => {
    setSaving(true);
    try {
      await action();
      if (successMessage) toast(successMessage, 'success');
      return true;
    } catch (err) {
      console.error(err);
      toast(err.message || 'Something went wrong while saving.', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Product Form State
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);
  const [colorVariants, setColorVariants] = useState([{ color: '', image: '' }]);

  // Deal Form State
  const [dealForm, setDealForm] = useState({ title: '', description: '', image: '' });

  // Shape Form State
  const [shapeForm, setShapeForm] = useState({ name: '', image: '' });

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
    setColorVariants([{ color: '', image: '' }]);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    const colors = colorVariants.map(v => v.color.trim()).filter(Boolean);
    const colorImages = {};
    colorVariants.forEach(v => {
      if (v.color.trim() && v.image) {
        colorImages[v.color.trim()] = v.image;
      }
    });

    const price = parseFloat(productForm.price);
    if (!(price > 0)) {
      toast('Please enter a valid price.', 'error');
      return;
    }
    // Empty or invalid discount used to become NaN and broke every price on the site
    const discount = Math.min(100, Math.max(0, parseInt(productForm.discount, 10) || 0));

    const productData = {
      ...productForm,
      price,
      discount,
      colors,
      colorImages,
      image: colorVariants[0]?.image || 'nail_product_1_1776175995380.png'
    };

    const ok = await runSave(
      () => editingProductId
        ? modifyProduct({ ...productData, id: editingProductId })
        : createProduct(productData),
      editingProductId ? 'Product updated' : 'Product added'
    );
    if (ok) resetProductForm();
  };

  const handleEditProduct = (product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      code: product.code || '',
      price: product.price.toString(),
      discount: product.discount?.toString() || '0',
      description: product.description
    });

    if (product.colors && product.colors.length > 0) {
      setColorVariants(product.colors.map(color => ({
        color,
        image: product.colorImages && product.colorImages[color] ? product.colorImages[color] : (product.image || '')
      })));
    } else {
      setColorVariants([{ color: '', image: product.image || '' }]);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    if (!dealForm.image) {
      toast('Please wait for the banner image to finish loading.', 'error');
      return;
    }
    const ok = await runSave(() => createDeal({ ...dealForm, active: true }), 'Deal added');
    if (!ok) return;
    setDealForm({ title: '', description: '', image: '' });
    setDealFileKey(k => k + 1);
  };

  const handleShapeSubmit = async (e) => {
    e.preventDefault();
    if (!shapeForm.image) {
      toast('Please wait for the shape image to finish loading.', 'error');
      return;
    }
    const ok = await runSave(() => createShape({ ...shapeForm, name: shapeForm.name.trim() }), 'Shape added');
    if (!ok) return;
    setShapeForm({ name: '', image: '' });
    setShapeFileKey(k => k + 1);
  };

  // Reads an image file as a data URL
  const readImage = (e, onLoad) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onLoad(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleVariantUpload = (index, e) =>
    readImage(e, image => setColorVariants(prev => prev.map((v, i) => i === index ? { ...v, image } : v)));
  const handleDealImageUpload = (e) => readImage(e, image => setDealForm(prev => ({ ...prev, image })));
  const handleShapeImageUpload = (e) => readImage(e, image => setShapeForm(prev => ({ ...prev, image })));

  const handleDeleteProduct = (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    if (editingProductId === p.id) resetProductForm();
    runSave(() => removeProduct(p.id), 'Product deleted');
  };

  const TABS = [
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'deals', label: 'Deals', icon: Tag, count: deals.length },
    { id: 'shapes', label: 'Shapes', icon: Scissors, count: shapes.length },
  ];

  return (
    <div className="page">
      <div className="container">
        <div className="admin-head">
          <div>
            <span className="eyebrow">Owner</span>
            <h1>Dashboard</h1>
            <p>Manage your products, promotions and nail shapes.</p>
          </div>
        </div>

        <div className="tabs" role="tablist">
          {TABS.map(({ id, label, icon, count }) => {
            const Icon = icon;
            return (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`tab ${activeTab === id ? 'is-active' : ''}`}>
              <Icon size={16} /> {label} <span className="tab-count">{count}</span>
            </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <div className="admin-grid">
            <div className="panel">
              <h2>{editingProductId ? 'Edit product' : 'Add a product'}</h2>
              <form onSubmit={handleProductSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-name">Name</label>
                    <input id="p-name" required type="text" className="form-input" value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-code">Design code</label>
                    <input id="p-code" type="text" className="form-input" maxLength={12}
                      placeholder={editingProductId ? productCode({ id: editingProductId }) : 'Auto'}
                      value={productForm.code}
                      onChange={e => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-price">Price (₹)</label>
                    <input id="p-price" required type="number" min="0.01" step="0.01" className="form-input" value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="p-discount">Discount (%)</label>
                    <input id="p-discount" type="number" min="0" max="100" className="form-input" value={productForm.discount}
                      onChange={e => setProductForm({ ...productForm, discount: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Colours & photos</label>
                  {colorVariants.map((variant, index) => (
                    <div key={index} className="variant-row">
                      <input required type="text" className="form-input" placeholder="Colour, e.g. Nude" aria-label={`Colour ${index + 1}`}
                        value={variant.color}
                        onChange={e => {
                          const color = e.target.value;
                          setColorVariants(prev => prev.map((v, i) => i === index ? { ...v, color } : v));
                        }} />
                      {variant.image && <span className="variant-thumb" style={{ backgroundImage: `url("${imageSrc(variant.image)}")` }} />}
                      <label className="file-btn">
                        <ImageIcon size={15} /> {variant.image ? 'Change' : 'Photo'}
                        <input type="file" accept="image/*" onChange={(e) => handleVariantUpload(index, e)} hidden />
                      </label>
                      {index > 0 && (
                        <button type="button" className="icon-btn danger" aria-label="Remove colour"
                          onClick={() => setColorVariants(prev => prev.filter((_, i) => i !== index))}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="link-btn" style={{ marginTop: '0.25rem' }}
                    onClick={() => setColorVariants(prev => [...prev, { color: '', image: '' }])}>
                    <Plus size={15} /> Add another colour
                  </button>
                  <p className="form-hint">The first colour's photo is used as the main product image.</p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="p-desc">Description</label>
                  <textarea id="p-desc" required className="form-input" rows="3" value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                  {editingProductId ? <><Pencil size={16} /> Save changes</> : <><Plus size={16} /> Add product</>}
                </button>
                {editingProductId && (
                  <button type="button" onClick={resetProductForm} className="btn btn-outline btn-block" style={{ marginTop: '0.6rem' }}>
                    Cancel editing
                  </button>
                )}
              </form>
            </div>

            <div>
              <div className="admin-list-head">
                <h2>Current products</h2>
              </div>
              {products.length === 0 ? (
                <div className="list-empty">No products yet. Add your first one.</div>
              ) : (
                <div className="list">
                  {products.map(p => (
                    <div key={p.id} className="list-item" style={editingProductId === p.id ? { borderColor: 'var(--accent)' } : undefined}>
                      <div className="list-item-main">
                        <span className="list-item-img" style={{ backgroundImage: `url("${imageSrc(p.image)}")` }} />
                        <div className="list-item-text">
                          <h4>{p.name}</h4>
                          <p>
                            {productCode(p)} · {formatPrice(p.price)}
                            {p.discount > 0 ? ` · ${p.discount}% off` : ''} · {p.colors?.length || 0} colours
                          </p>
                        </div>
                      </div>
                      <div className="list-item-actions">
                        <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => handleEditProduct(p)}><Pencil size={17} /></button>
                        <button className="icon-btn danger" aria-label={`Delete ${p.name}`} onClick={() => handleDeleteProduct(p)}><Trash2 size={17} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="admin-grid">
            <div className="panel">
              <h2>Add a deal</h2>
              <form onSubmit={handleDealSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="d-title">Title</label>
                  <input id="d-title" required type="text" className="form-input" value={dealForm.title}
                    onChange={e => setDealForm({ ...dealForm, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="d-image">Banner image</label>
                  <input id="d-image" key={dealFileKey} required type="file" accept="image/*" className="form-input" onChange={handleDealImageUpload} />
                  {dealForm.image && <img src={dealForm.image} alt="Banner preview" className="image-preview" />}
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="d-desc">Offer text</label>
                  <textarea id="d-desc" required className="form-input" rows="3" value={dealForm.description}
                    onChange={e => setDealForm({ ...dealForm, description: e.target.value })} />
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={saving}><Plus size={16} /> Add deal</button>
              </form>
            </div>

            <div>
              <div className="admin-list-head">
                <h2>Active deals</h2>
              </div>
              {deals.length === 0 ? (
                <div className="list-empty">No deals running. Banners you add appear on the home page.</div>
              ) : (
                <div className="list">
                  {deals.map(d => (
                    <div key={d.id} className="list-item">
                      <div className="list-item-main">
                        <span className="list-item-img wide" style={{ backgroundImage: `url("${imageSrc(d.image)}")` }} />
                        <div className="list-item-text">
                          <h4>{d.title}</h4>
                          <p>{d.description}</p>
                        </div>
                      </div>
                      <div className="list-item-actions">
                        <button className="icon-btn danger" aria-label={`Delete ${d.title}`}
                          onClick={() => { if (window.confirm(`Delete deal "${d.title}"?`)) runSave(() => removeDeal(d.id), 'Deal deleted'); }}>
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shapes' && (
          <div className="admin-grid">
            <div className="panel">
              <h2>Add a shape</h2>
              <form onSubmit={handleShapeSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-name">Shape name</label>
                  <input id="s-name" required type="text" className="form-input" placeholder="e.g. Almond, Square, Coffin" value={shapeForm.name}
                    onChange={e => setShapeForm({ ...shapeForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="s-image">Reference image</label>
                  <input id="s-image" key={shapeFileKey} required type="file" accept="image/*" className="form-input" onChange={handleShapeImageUpload} />
                  {shapeForm.image && <img src={shapeForm.image} alt="Shape preview" className="image-preview contain" />}
                </div>
                <button type="submit" className="btn btn-primary btn-block" disabled={saving}><Plus size={16} /> Add shape</button>
              </form>
            </div>

            <div>
              <div className="admin-list-head">
                <h2>Available shapes</h2>
              </div>
              {shapes.length === 0 ? (
                <div className="list-empty">No shapes yet. Customers can still order without choosing one.</div>
              ) : (
                <div className="shape-admin-grid">
                  {shapes.map(s => (
                    <div key={s.id} className="shape-admin-card">
                      <button className="icon-btn danger" aria-label={`Delete ${s.name}`}
                        onClick={() => { if (window.confirm(`Delete shape "${s.name}"?`)) runSave(() => removeShape(s.id), 'Shape deleted'); }}>
                        <Trash2 size={15} />
                      </button>
                      <div className="shape-option-img" style={{ backgroundImage: `url("${imageSrc(s.image)}")` }} />
                      <h4>{s.name}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
