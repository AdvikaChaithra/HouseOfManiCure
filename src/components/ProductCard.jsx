import React from 'react';
import { Link } from 'react-router-dom';
import { unitPrice } from '../utils/cart';
import { imageSrc, swatchColor, formatPrice } from '../utils/display';

const MAX_SWATCHES = 4;

const ProductCard = ({ product }) => {
  const colors = product.colors || [];
  const hasDiscount = product.discount > 0;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card-media">
        <img src={imageSrc(product.image)} alt={product.name} loading="lazy" />
        {hasDiscount && <span className="badge badge-solid">−{product.discount}%</span>}
      </div>
      <div className="product-card-body">
        <h3 className="product-card-name">{product.name}</h3>
        {product.description && <p className="product-card-desc">{product.description}</p>}
        <div className="product-card-meta">
          <div className="price-line">
            <span className="price">{formatPrice(unitPrice(product))}</span>
            {hasDiscount && <span className="price-old">{formatPrice(product.price)}</span>}
          </div>
          {colors.length > 0 && (
            <div className="swatches" aria-label={`${colors.length} colours: ${colors.join(', ')}`}>
              {colors.slice(0, MAX_SWATCHES).map(c => (
                <span key={c} className="swatch" style={{ background: swatchColor(c) }} title={c} />
              ))}
              {colors.length > MAX_SWATCHES && <span className="swatch-more">+{colors.length - MAX_SWATCHES}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
