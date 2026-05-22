import React, { createContext, useState, useEffect } from "react";
import apiClient from "../api/client";

export const CartContext = createContext();

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const mapBackendCartItems = (items) =>
    items.map((item) => ({
      id: item.product_id,
      cartItemId: item.id,
      name: item.product_name,
      price: Number(item.price) || 0,
      qty: Number(item.quantity) || 1,
      image: item.image_url || "",
      stock: item.stock || 0,
    }));

  const loadCartFromBackend = async (user) => {
    try {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      const response = await apiClient.getUserCart(user.id);
      const serverItems = response.data || [];

      if (localCart.length > 0) {
        await Promise.all(
          localCart.map((localItem) =>
            apiClient.addCartItem({
              userId: user.id,
              productId: localItem.id,
              name: localItem.name,
              price: localItem.price,
              quantity: localItem.qty || 1,
              imageUrl: localItem.image,
            }),
          ),
        );
      }

      const mergedResponse = await apiClient.getUserCart(user.id);
      const mergedItems = mergedResponse.data || [];
      setCart(mapBackendCartItems(mergedItems));
    } catch (error) {
      console.error("Error loading backend cart:", error);
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(savedCart);
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser && storedUser.id) {
      loadCartFromBackend(storedUser).finally(() => setLoading(false));
    } else {
      const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCart(savedCart);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const syncCartItem = async (item) => {
    const storedUser = getStoredUser();
    if (!storedUser || !storedUser.id) return null;

    try {
      const payload = {
        userId: storedUser.id,
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.qty || 1,
        imageUrl: item.image,
      };

      return await apiClient.addCartItem(payload);
    } catch (error) {
      console.error("Error syncing cart item to backend:", error);
      return null;
    }
  };

  const addToCart = async (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    const newQty = existingItem ? (existingItem.qty || 1) + 1 : 1;

    if (product.stock && newQty > product.stock) {
      alert(`Cannot add more. Only ${product.stock} items available in stock.`);
      return;
    }

    const nextCart = existingItem
      ? cart.map((item) =>
          item.id === product.id ? { ...item, qty: newQty } : item,
        )
      : [...cart, { ...product, qty: 1 }];

    setCart(nextCart);

    const result = await syncCartItem({
      ...product,
      qty: newQty,
    });

    if (result?.data?.id || result?.id) {
      setCart((previousCart) =>
        previousCart.map((item) =>
          item.id === product.id
            ? { ...item, cartItemId: result.data?.id || result.id }
            : item,
        ),
      );
    }
  };

  const removeFromCart = async (index) => {
    const item = cart[index];
    setCart(cart.filter((_, i) => i !== index));

    if (item?.cartItemId) {
      try {
        await apiClient.deleteCartItem(item.cartItemId);
      } catch (error) {
        console.error("Error deleting backend cart item:", error);
      }
    }
  };

  const updateQuantity = async (index, newQty) => {
    const item = cart[index];
    if (!item) return;

    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    if (item.stock && newQty > item.stock) {
      alert(`Cannot increase quantity. Only ${item.stock} items available in stock.`);
      return;
    }

    const nextCart = cart.map((cartItem, i) =>
      i === index ? { ...cartItem, qty: newQty } : cartItem,
    );

    setCart(nextCart);

    if (item.cartItemId) {
      try {
        await apiClient.updateCartItem(item.cartItemId, { quantity: newQty });
      } catch (error) {
        console.error("Error updating backend cart item:", error);
      }
    } else {
      await syncCartItem({ ...item, qty: newQty });
    }
  };

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.qty || 1),
      0,
    );
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + (item.qty || 1), 0);
  };

  const clearCart = async () => {
    const storedUser = getStoredUser();
    setCart([]);
    if (storedUser && storedUser.id) {
      try {
        await apiClient.clearUserCart(storedUser.id);
      } catch (error) {
        console.error("Error clearing backend cart:", error);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getTotalPrice,
        getTotalItems,
        clearCart,
        loading,
      }}>
      {children}
    </CartContext.Provider>
  );
};
