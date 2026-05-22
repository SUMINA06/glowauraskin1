import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import apiClient from '../api/client';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getTotalPrice } = useContext(CartContext);
  const [cartWithStock, setCartWithStock] = useState([]);

  useEffect(() => {
    const updateCartWithStock = async () => {
      const updatedCart = await Promise.all(
        cart.map(async (item) => {
          try {
            const response = await apiClient.getProductById(item.id);
            const product = response.data;
            return { ...item, stock: product.stock || 0 };
          } catch (error) {
            console.error('Error fetching stock for product:', item.id, error);
            return { ...item, stock: item.stock || 0 }; // fallback to existing stock
          }
        })
      );
      setCartWithStock(updatedCart);
    };

    if (cart.length > 0) {
      updateCartWithStock();
    } else {
      setCartWithStock([]);
    }
  }, [cart]);

  const displayCart = cartWithStock.length > 0 ? cartWithStock : cart;

  if (cart.length === 0) {
    return (
      <main style={{ minHeight: '70vh', padding: '30px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2>Your Cart</h2>
          <p>Your cart is empty</p>
          <Link to="/shop">
            <button style={{ padding: '10px 20px', backgroundColor: ' #ff6b9d', color: 'white', border: 'none', cursor: 'pointer' }}>
              Continue Shopping
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '70vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <h2>Your Cart</h2>
        
        <div id="cart-items">
          {displayCart.map((item, index) => {
            const currentQty = item.qty || 1;
            const maxStock = item.stock || 0;
            const canIncrement = currentQty < maxStock;

            return (
              <div key={index} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', border: '1px solid #ddd', padding: '15px', marginBottom: '10px' }}>
                <img
                  src={item.image || 'https://via.placeholder.com/100x100'}
                  alt={item.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                  onError={(e) => e.target.src = 'https://via.placeholder.com/100x100'}
                />
                <div style={{ flex: 1 }}>
                  <p><strong>{item.name}</strong></p>
                  <p>Price: Rs {item.price}</p>
                  {maxStock > 0 && <p style={{ fontSize: '12px', color: '#666' }}>Stock available: {maxStock}</p>}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <button
                      onClick={() => updateQuantity(index, currentQty - 1)}
                      style={{ padding: '4px 10px', backgroundColor: '#ff6b9d', color: 'white', border: 'none', cursor: 'pointer' }}
                    >
                      −
                    </button>
                    <span>{currentQty}</span>
                    <button
                      onClick={() => updateQuantity(index, currentQty + 1)}
                      disabled={!canIncrement}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: canIncrement ? '#ff6b9d' : '#ccc',
                        color: 'white',
                        border: 'none',
                        cursor: canIncrement ? 'pointer' : 'not-allowed'
                      }}
                      title={!canIncrement ? `Maximum stock reached (${maxStock})` : ''}
                    >
                      +
                    </button>
                    {!canIncrement && maxStock > 0 && (
                      <span style={{ fontSize: '12px', color: 'red', marginLeft: '10px' }}>
                        No more stock available
                      </span>
                    )}
                  </div>

                  <p>Subtotal: Rs {(item.price * currentQty).toFixed(0)}</p>
                  <button
                    onClick={() => removeFromCart(index)}
                    style={{ padding: '8px 14px', backgroundColor: '#ff6b9d', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <h3>Total: Rs {getTotalPrice().toFixed(0)}</h3>

        <Link to="/checkout">
          <button style={{ padding: '10px 20px', backgroundColor: ' #ff6b9d', color: 'white', border: 'none', cursor: 'pointer' }}>
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </main>
  );
};

export default Cart;
