import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import apiClient from "../api/client";
import skincareImg from "../images/skincare.jpg";

import "../css/styles.css";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, cart } = useContext(CartContext);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await apiClient.getAllProducts();
      const list = response.data || [];

      const withImages = await Promise.all(
        list.slice(0, 6).map(async (p) => {
          try {
            const imgRes = await apiClient.getProductImages(p.id);
            const img = imgRes.data?.[0]?.image_path;
            return {
              ...p,
              image: img
                ? `${apiClient.API_ROOT}${img}`
                : "https://via.placeholder.com/300x300",
            };
          } catch {
            return { ...p, image: "https://via.placeholder.com/300x300" };
          }
        })
      );

      setProducts(withImages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    // Check if product is in stock
    if (product.stock <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    // Check current quantity in cart
    const existingItem = cart.find((item) => item.id === product.id);
    const currentQty = existingItem ? existingItem.qty : 0;

    if (currentQty + 1 > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
      return;
    }

    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  // 👉 pick a featured product safely
  const featured = products.length > 0 ? products[0] : null;

  return (
    <>
      {/* 🔥 HERO */}
      <section className="hero-dark">
        <div className="hero-dark-container">
          <div className="hero-dark-text">
            <p className="hero-dark-tag">
              GlowAura • Skincare & Body Care
            </p>

            <h1>
              Elevate Your Skin <br />
              <span>Healthy Glow Starts Here</span>
            </h1>

            <p className="hero-dark-sub">
              Discover premium skincare and body care products crafted to
              nourish, hydrate, and enhance your natural beauty.
            </p>

            <div className="hero-dark-buttons">
              <Link to="/shop" className="btn-dark-primary">
                Shop Now →
              </Link>

              <Link to="/shop" className="btn-dark-outline">
                View Categories
              </Link>
            </div>
          </div>

          {/* ✅ HERO IMAGE WITH PRODUCT LINK */}
          <div className="hero-dark-image">
            {featured && (
              <Link to={`/product/${featured.id}`}>
                <img
                  src={skincareImg}
                  alt="Skincare Collection"
                />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 🌿 CATEGORY */}
      <section className="section" id="categories">
  <div className="section-header">
    <h2>Shop by Category</h2>
    <p>
      Discover skincare and body care essentials designed for healthy,
      glowing, and nourished skin.
    </p>
  </div>

  <div className="grid categories-grid">

    {/* FACE CARE */}
    <article className="card category-card">
      <div className="card-tag">Face Care</div>
      <h3>Cleansers & Serums</h3>
      <p>
        Gentle cleansers and powerful serums to refresh, hydrate, and
        brighten your skin.
      </p>
      <ul className="card-list">
        <li>Deep cleansing formulas</li>
        <li>Vitamin C & hydrating serums</li>
        <li>Glow boosting skincare</li>
      </ul>
      <Link to="/shop" className="link-arrow">
        Explore face care →
      </Link>
    </article>

    {/* BODY CARE */}
    <article className="card category-card">
      <div className="card-tag">Body Care</div>
      <h3>Lotions & Scrubs</h3>
      <p>
        Nourishing body care products that soften, smooth, and rejuvenate
        your skin.
      </p>
      <ul className="card-list">
        <li>Hydrating body lotions</li>
        <li>Exfoliating scrubs</li>
        <li>Soft & radiant skin care</li>
      </ul>
      <Link to="/shop" className="link-arrow">
        Shop body care →
      </Link>
    </article>

    {/* MOISTURIZER */}
    <article className="card category-card">
      <div className="card-tag">Moisturizers</div>
      <h3>Hydration & Repair</h3>
      <p>
        Lock in moisture and protect your skin barrier with rich and
        lightweight moisturizers.
      </p>
      <ul className="card-list">
        <li>Daily hydration creams</li>
        <li>Night repair formulas</li>
        <li>Suitable for all skin types</li>
      </ul>
      <Link to="/shop" className="link-arrow">
        Discover moisturizers →
      </Link>
    </article>

  </div>
</section>
    
  {/* 🔥 DYNAMIC PRODUCTS — SAME DESIGN */}
      <section className="category-section">
        <h2>EXPLORE OUR WORLD OF PRODUCTS!</h2>

        {loading ? (
          <p style={{ textAlign: "center" }}>Loading products...</p>
        ) : (
          <div className="category-wrapper">
            <div className="category-list">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/300x300")
                    }
                  />
                  <h4>{product.name}</h4>
                  <p style={{ fontWeight: "bold" }}>Rs {product.price}</p>

                  <button
                    className="hero-btn btn-primary small"
                    onClick={() => handleAddToCart(product)}>
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Home;