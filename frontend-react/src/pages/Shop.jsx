import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Products from "./Products";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [showCategories, setShowCategories] = useState(true);
  const [showPrices, setShowPrices] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOption, setSortOption] = useState("default");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Read search query from URL
  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchQuery(query);
  }, [searchParams]);

  const selectCategory = (e) => setSelectedCategory(e.target.value);
  const selectPriceRange = (e) => setSelectedPriceRange(e.target.value);
  const changeSort = (e) => setSortOption(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  return (
    <main>
      <div className="container">

        {/* 🔍 SIDEBAR */}
        <aside className="sidebar">
          
          {/* CATEGORY FILTER */}
          <div className="filter-box">
            <div
              className="filter-header"
              onClick={() => setShowCategories(!showCategories)}
            >
              <h3>Categories</h3>
              <span className="toggle">{showCategories ? "−" : "+"}</span>
            </div>

            {showCategories && (
              <div className="filter-content">
                <label>
                  <input
                    type="radio"
                    name="category"
                    value=""
                    onChange={selectCategory}
                    checked={selectedCategory === ""}
                  />{" "}
                  All Products
                </label>

                <label>
                  <input
                    type="radio"
                    name="category"
                    value="facecare"
                    onChange={selectCategory}
                    checked={selectedCategory === "facecare"}
                  />{" "}
                  Face Care
                </label>

                <label>
                  <input
                    type="radio"
                    name="category"
                    value="bodycare"
                    onChange={selectCategory}
                    checked={selectedCategory === "bodycare"}
                  />{" "}
                  Body Care
                </label>

                <label>
                  <input
                    type="radio"
                    name="category"
                    value="haircare"
                    onChange={selectCategory}
                    checked={selectedCategory === "haircare"}
                  />{" "}
                  Hair Care
                </label>

              

                <label>
                  <input
                    type="radio"
                    name="category"
                    value="serum"
                    onChange={selectCategory}
                    checked={selectedCategory === "serum"}
                  />{" "}
                  Serums
                </label>
              </div>
            )}
          </div>

          {/* PRICE FILTER */}
          <div className="filter-box">
            <div
              className="filter-header"
              onClick={() => setShowPrices(!showPrices)}
            >
              <h3>Price Filter</h3>
              <span className="toggle">{showPrices ? "−" : "+"}</span>
            </div>

            {showPrices && (
              <div className="filter-content">
                <label>
                  <input
                    type="radio"
                    name="price"
                    value=""
                    onChange={selectPriceRange}
                    checked={selectedPriceRange === ""}
                  />{" "}
                  All
                </label>

                <label>
                  <input
                    type="radio"
                    name="price"
                    value="0-500"
                    onChange={selectPriceRange}
                    checked={selectedPriceRange === "0-500"}
                  />{" "}
                  Rs 0 – Rs 500
                </label>

                <label>
                  <input
                    type="radio"
                    name="price"
                    value="500-1000"
                    onChange={selectPriceRange}
                    checked={selectedPriceRange === "500-1000"}
                  />{" "}
                  Rs 500 – Rs 1,000
                </label>

                <label>
                  <input
                    type="radio"
                    name="price"
                    value="1000-2000"
                    onChange={selectPriceRange}
                    checked={selectedPriceRange === "1000-2000"}
                  />{" "}
                  Rs 1,000 – Rs 2,000
                </label>

                <label>
                  <input
                    type="radio"
                    name="price"
                    value="2000-5000"
                    onChange={selectPriceRange}
                    checked={selectedPriceRange === "2000-5000"}
                  />{" "}
                  Rs 2,000 – Rs 5,000
                </label>
              </div>
            )}
          </div>
        </aside>

        {/* 🛍 MAIN CONTENT */}
        <section className="content">
          <div className="page-header">
            <h2>
              {searchQuery
                ? `Search: "${searchQuery}"`
                : "Shop Skincare & Body Care"}
            </h2>

            <p className="subtitle">
              {searchQuery
                ? "Showing results for your search"
                : "Explore premium skincare, body care, and beauty essentials designed to nourish, hydrate, and enhance your natural glow."}
            </p>
          </div>

          {/* TOOLBAR */}
          <div className="toolbar">
            <div className="search-filter">
              <input
                type="text"
                placeholder="Search skincare products..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="shop-search-input"
              />
            </div>

            <select value={sortOption} onChange={changeSort}>
              <option value="default">Default sorting</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>

          {/* PRODUCTS */}
          <Products
            category={selectedCategory}
            priceRange={selectedPriceRange}
            sort={sortOption}
            search={searchQuery}
            title="Shop Products"
            showHeader={false}
          />
        </section>
      </div>
    </main>
  );
};

export default Shop;