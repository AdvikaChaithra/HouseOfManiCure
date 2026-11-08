import React from 'react';
import { Sparkles } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

const Shop = () => {
  const { products, loading } = useStore();

  return (
    <div className="page">
      <div className="container">
        <div className="page-head">
          <span className="eyebrow">The collection</span>
          <h1>Shop all designs</h1>
          <p>Handmade, luxurious press-on nails. Every set can be customised to your shape, size and colour.</p>
        </div>

        {!loading && products.length > 0 && (
          <div className="product-grid">
            {products.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Sparkles size={26} /></div>
            <h2>New sets coming soon</h2>
            <p>We're crafting new designs right now. Please check back shortly.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
