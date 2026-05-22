import React, { useContext, useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";

const Header = () => {
  const { cart, getTotalPrice } = useContext(CartContext);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch(e);
    }
  };

  useEffect(() => {
    // Check if admin is logged in
    const adminUser = localStorage.getItem("adminUser");
    if (adminUser) {
      setIsAdmin(true);
      navigate("/admin/dashboard");
      return;
    }

    // Get regular website user
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing user data", err);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <header className="header">
        <div className="nav-logo">
  <span className="logo-text">
    Glow<span className="accent">Aura</span>
  </span>
</div>
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button type="submit">Search</button>
        </form>

        <div className="header-right">
          <div className="info">
            <i className="fa fa-phone"></i>
            <span>
              Need Help?
              <br />
              <b>+977-1-5300647</b>
            </span>
          </div>

          <div className="info">
            <i className="fa fa-user"></i>
            <span>
              Account
              <br />
              <b>
                {user ? (
                  <>
                    <span style={{ color: '#000' }}>{user.username || user.email}</span>
                    <br />
                    <button
                      onClick={handleLogout}
                      style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        textDecoration: "underline",
                        padding: 0,
                      }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={"./login"}>Login</Link> /
                    <Link to={"./register"}>Register</Link>
                  </>
                )}
              </b>
            </span>
          </div>

          <Link
            to="/cart"
            className="user-actions"
            style={{ textDecoration: "none", color: "inherit" }}>
            <i className="fa fa-cart-shopping"></i>
            <span>
              Cart
              <br />
              <b>Rs {getTotalPrice().toFixed(0)}</b>
            </span>
          </Link>
        </div>
      </header>

      <nav className="navbar">
        <button className="nav-toggle" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink
            to="/shop"
            className={({ isActive }) => (isActive ? "active" : "")}>
            Shop
          </NavLink>
         
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "active" : "")}>
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? "active" : "")}>
            Contact
          </NavLink>
        </ul>
      </nav>
    </>
  );
};

export default Header;
