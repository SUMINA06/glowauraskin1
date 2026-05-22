import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Artisans from "./pages/Artisans";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Products from "./pages/Products";
import AdminDashboard from "./admin/pages/Dashboard";
import AdminProducts from "./admin/pages/Products";
import AdminUsers from "./admin/pages/Users";
import AdminImages from "./admin/pages/Images";
import AdminOrders from "./admin/pages/Orders";
import AdminLogin from "./admin/components/login";
import AdminRegister from "./admin/components/register";
import ProtectedRoute from "./admin/components/ProtectedRoute";

// Import all CSS files globally
import "./css/styles.css";
import "./css/footer.css";
import "./css/cart.css";
import "./css/checkout.css";
import "./css/art.css";
import "./css/bag.css";
import "./css/clay.css";
import "./css/jute.css";
import "./css/pasmina.css";
import "./css/slide.css";
import "./css/wall.css";
import "./css/wooden.css";

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <CartProvider>
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />

        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />

        <Route
          path="/wooden"
          element={<Products category="Wooden" title="Wooden Crafts" />}
        />
        <Route
          path="/art"
          element={<Products category="Arts" title="Art and Paintings" />}
        />
        <Route
          path="/bag"
          element={<Products category="Bags" title="Bags" />}
        />
        <Route
          path="/clay"
          element={<Products category="Clay" title="Clay Crafts" />}
        />
        <Route
          path="/jute"
          element={<Products category="Jute" title="Jute Products" />}
        />
        <Route
          path="/wall"
          element={<Products category="Wall" title="Wall Art" />}
        />
        <Route
          path="/pasmina"
          element={<Products category="Pasmina" title="Pasmina" />}
        />

        {/* Admin routes */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/images"
          element={
            <ProtectedRoute>
              <AdminImages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
      </Routes>
      {!isAdmin && <Footer />}
    </CartProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
