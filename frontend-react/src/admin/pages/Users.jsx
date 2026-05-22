import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import apiClient from "../../api/client";
import Modal from "../components/Modal";
import Confirm from "../components/Confirm";
import "../css/tables.css";

const initialForm = {
  username: "",
  email: "",
  phone: "",
  city: "",
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [confirm, setConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAllUsers();
      setUsers(res.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingUserId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUserId(user.id);
    setForm({
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      city: user.city || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUserId) {
        await apiClient.updateUser(editingUserId, form);
      } else {
        await apiClient.createUser(form);
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const confirmDelete = (id) => {
    setConfirm({ show: true, id });
  };

  const doDelete = async () => {
    try {
      await apiClient.deleteUser(confirm.id);
      setConfirm({ show: false, id: null });
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <AdminLayout title="Users">
      <div id="users-page">
        <div className="page-header">
          <h2>Manage Users</h2>
          <button className="btn-primary" onClick={openAdd}>
            + Add User
          </button>
        </div>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || "-"}</td>
                      <td>{u.city || "-"}</td>
                      <td>
                        <button
                          className="btn-edit"
                          type="button"
                          onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          type="button"
                          onClick={() => confirmDelete(u.id)}
                          style={{ marginLeft: 8 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          show={showModal}
          onClose={() => setShowModal(false)}
          title={editingUserId ? "Edit User" : "Add User"}>
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-row">
              <label>City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
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
                style={{ marginLeft: 8 }}>
                {editingUserId ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </Modal>

        <Confirm
          show={confirm.show}
          message="Are you sure you want to delete this user?"
          onConfirm={doDelete}
          onCancel={() => setConfirm({ show: false, id: null })}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
