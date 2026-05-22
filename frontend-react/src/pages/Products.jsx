import React, { useState, useEffect, useContext } from "react";
import { CartContext } from "../context/CartContext";
import apiClient from "../api/client";

const Products = ({
  category,
  title,
  showHeader = true,
  sort,
  priceRange,
  search,
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, cart } = useContext(CartContext);

  useEffect(() => {
    loadProducts();
  }, [category, sort, priceRange, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllProducts();
      let filteredProducts = response.data || [];

      // Search filtering (by name, description, category)
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredProducts = filteredProducts.filter((p) => {
          const name = (p.name || "").toLowerCase();
          const description = (p.description || "").toLowerCase();
          const cat = (p.category || "").toLowerCase();
          return (
            name.includes(searchLower) ||
            description.includes(searchLower) ||
            cat.includes(searchLower)
          );
        });
      }

      // Category filtering (supports string or array)
      if (category) {
        if (Array.isArray(category)) {
          if (category.length > 0) {
            filteredProducts = filteredProducts.filter((p) =>
              category.some((cat) =>
                (p.category || "").toLowerCase().includes(cat.toLowerCase()),
              ),
            );
          }
        } else {
          if (category !== "") {
            filteredProducts = filteredProducts.filter((p) =>
              (p.category || "").toLowerCase().includes(category.toLowerCase()),
            );
          }
        }
      }

      // Price range filtering (value like "0-2000")
      if (priceRange) {
        const parts = priceRange.split("-").map((v) => parseFloat(v));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const [min, max] = parts;
          filteredProducts = filteredProducts.filter((p) => {
            const price = parseFloat(p.price) || 0;
            return price >= min && price <= max;
          });
        }
      }

      // Sorting
      if (sort === "low-high") {
        filteredProducts.sort(
          (a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0),
        );
      } else if (sort === "high-low") {
        filteredProducts.sort(
          (a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0),
        );
      }

      // Load images for each product
      const productsWithImages = await Promise.all(
        filteredProducts.map(async (product) => {
          try {
            const imagesResponse = await apiClient.getProductImages(product.id);
            const images = imagesResponse.data || [];
            return {
              ...product,
              image:
                images.length > 0
                  ? `${apiClient.API_ROOT}${images[0].image_path}`
                  : "https://via.placeholder.com/300x300",
            };
          } catch {
            return {
              ...product,
              image: "https://via.placeholder.com/300x300",
            };
          }
        }),
      );

      setProducts(productsWithImages);
    } catch (error) {
      console.error("Error loading products:", error);
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

    addToCart({
      name: product.name,
      price: product.price,
      image: product.image,
      id: product.id,
      stock: product.stock,
    });
    alert(`${product.name} added to cart!`);
  };

  return (
    <main style={{ minHeight: "70vh" }}>
      <div className="container">
        {showHeader && (
          <div className="page-header">
            <h2>{title || "Products"}</h2>
            <p>{title || "Browse our collection"}</p>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: "50px" }}>
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "50px" }}>
            No products found in this category.
          </p>
        ) : (
          <section className="section slim">
            <div className="grid products-grid">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="card product"
                  data-category={product.category}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-img"
                    onError={(e) =>
                      (e.target.src = "https://via.placeholder.com/300x300")
                    }
                  />
                  <span className="card-tag">
                    {product.category || "Product"}
                  </span>
                  <p className="product-desc">
                    <h3>{product.name}</h3>
                    {product.description || "Handcrafted Nepali product"}
                  </p>
                  <div className="product-meta">
                    <span className="price">
                      Rs {parseFloat(product.price).toFixed(0)}
                    </span>
                    <button
                      className="btn primary small add-to-cart"
                      onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Products;
