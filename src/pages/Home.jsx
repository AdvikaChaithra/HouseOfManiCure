import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Recycle, Ruler, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { imageSrc } from '../utils/display';

const STEPS = [
  { title: 'Choose a design', text: 'Browse the collection and pick the colour you love.' },
  { title: 'Pick shape & size', text: 'Select a shape and a standard size, or send your exact measurements.' },
  { title: 'Order on WhatsApp', text: 'Your order opens in WhatsApp ready to send. We confirm it, share the payment QR and start crafting your set.' },
];

const GALLERY = ['N1.jpeg', 'nail1.jpeg', 'N2.jpeg', 'N3.jpeg'];

const Home = () => {
  const { deals, products, loading } = useStore();

  const activeDeals = deals.filter(d => d.active);
  const featuredProducts = products.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow animate-rise">Handmade press-on nails</span>
            <h1 className="hero-title animate-rise delay-1">
              Salon-worthy nails, <em>made just for you.</em>
            </h1>
            <p className="hero-text animate-rise delay-1">
              Premium, reusable press-ons crafted by hand in your shape, size and colour — ready in minutes, no salon needed.
            </p>
            <div className="hero-actions animate-rise delay-2">
              <Link to="/shop" className="btn btn-primary">
                Shop the collection <ArrowRight size={17} />
              </Link>
              <a href="#how-it-works" className="btn btn-outline">How it works</a>
            </div>
            <div className="hero-perks animate-rise delay-2">
              <span className="hero-perk"><Sparkles size={16} /> Handcrafted</span>
              <span className="hero-perk"><Recycle size={16} /> Reusable</span>
              <span className="hero-perk"><Ruler size={16} /> Custom fit</span>
            </div>
          </div>

          <div className="hero-media animate-rise delay-1">
            <img src="/N1.jpeg" alt="A set of handmade polka-dot press-on nails in a Haus of ManiCure case" />
            <div className="hero-note">
              <span className="hero-note-icon"><Sparkles size={17} /></span>
              <div>
                <strong>Made to order</strong>
                <span className="text-muted">Every set, one at a time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deals */}
      {activeDeals.length > 0 && (
        <section className="container">
          {activeDeals.map(deal => (
            <div key={deal.id} className="deal">
              <div className="deal-media" style={{ backgroundImage: `url("${imageSrc(deal.image)}")` }} role="img" aria-label={deal.title} />
              <div className="deal-body">
                <span className="badge">Limited offer</span>
                <h2>{deal.title}</h2>
                <p>{deal.description}</p>
                <Link to="/shop" className="btn btn-outline">View collection</Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Featured products */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Bestsellers</span>
            <h2>Trending now</h2>
            <p>Our most-loved sets this season.</p>
          </div>

          {!loading && (
            <div className="product-grid">
              {featuredProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          )}

          <div className="center-action">
            <Link to="/shop" className="btn btn-outline">View all designs</Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section--muted" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Simple ordering</span>
            <h2>How it works</h2>
          </div>
          <div className="steps">
            {STEPS.map((step, i) => (
              <div className="step" key={step.title}>
                <div className="step-num">0{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Our work</span>
            <h2>Fresh from the studio</h2>
          </div>
          <div className="gallery">
            {GALLERY.map(img => (
              <div className="gallery-item" key={img}>
                <img src={`/${img}`} alt="Handmade press-on nail set" loading="lazy" />
              </div>
            ))}
          </div>
          <div className="center-action">
            <Link to="/shop" className="btn btn-primary">
              Find your set <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
