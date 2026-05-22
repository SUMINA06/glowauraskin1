import React, { useState, useEffect } from "react";
import apiClient from "../../api/client";
import AdminLayout from "../components/AdminLayout";
import Modal from "../components/Modal";
import "../css/tables.css";

const initialForm = { name: "", description: "", price: "", category: "", stock: "" };

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAllProducts();
      const items = response.data || [];
      const productsWithImages = await Promise.all(
        (Array.isArray(items) ? items : []).map(async (product) => {
          try {
            const imageResponse = await apiClient.getProductImages(product.id);
            const images = imageResponse.data || [];
            return {
              ...product,
              image:
                images.length > 0
                  ? `${apiClient.API_ROOT}${images[0].image_path}`
                  : "https://via.placeholder.com/120x120",
            };
          } catch (e) {
            return {
              ...product,
              image: "https://via.placeholder.com/120x120",
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

  const openAdd = () => {
    setEditingId(null);
    setForm(initialForm);
    setFile(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price || "",
      category: p.category || "",
      stock: p.stock || "",
    });
    setFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      category: form.category,
      stock: form.stock,
    };

    if (editingId) {
      try {
        await apiClient.updateProduct(editingId, payload, file);
        setShowModal(false);
        loadProducts();
      } catch (err) {
        console.error("Error updating product", err);
        alert('Failed to update product');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      await apiClient.createProduct(payload, file);
      setShowModal(false);
      loadProducts(); // 🔥 forces image to appear immediately
    } catch (err) {
      console.error("Error creating product", err);
      alert('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await apiClient.deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.error("Error deleting product", err);
    }
  };

  return (
    <AdminLayout title="Products">
      <div id="products-page">
        <div className="page-header">
          <h2>Manage Products</h2>
          <button
            className="btn-primary"
            id="add-product-btn"
            onClick={openAdd}>
            + Add Product
          </button>
        </div>

        <div className="table-container">
          <table className="data-table" id="products-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className={product.__new ? '__new' : ''}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>Rs {product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: 60, height: 60, objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/120x120';
                        }}
                      />
                    </td>
                    <td>{product.createdAt || "-"}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => openEdit(product)}>
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteProduct(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Modal
          show={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? "Edit Product" : "Add Product"}>
          <form id="product-form" onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-row">
              <label>Name</label>
              <input
                required
                disabled={isSubmitting}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea
                disabled={isSubmitting}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="form-row">
              <label>Price</label>
              <input
                required
                disabled={isSubmitting}
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Category</label>
              <input
                disabled={isSubmitting}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Stock</label>
              <input
                required
                disabled={isSubmitting}
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>Image</label>
              <input
                type="file"
                accept="image/*"
                disabled={isSubmitting}
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn"
                type="button"
                onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                type="submit"
                style={{ marginLeft: 8 }}
                disabled={isSubmitting}>
                {isSubmitting && (
                  <span className="spinner" aria-hidden="true" />
                )}
                {editingId ? (isSubmitting ? 'Saving...' : 'Save') : (isSubmitting ? 'Creating...' : 'Create')}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
