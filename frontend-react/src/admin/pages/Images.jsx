import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import apiClient from "../../api/client";

const AdminImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getAllImages();
      setImages(res.data || []);
    } catch (error) {
      console.error("Error loading images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Select a file");
    const fd = new FormData();
    fd.append("image", file);
    try {
      await apiClient.uploadImage(fd);
      setFile(null);
      loadImages();
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const deleteImage = async (id) => {
    if (!confirm("Delete this image?")) return;
    try {
      await apiClient.deleteImage(id);
      loadImages();
    } catch (err) {
      console.error("Error deleting image", err);
    }
  };

  return (
    <AdminLayout title="Images">
      <div id="images-page">
        <div className="page-header">
          <h2>Manage Images</h2>
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
            <button
              className="btn-primary"
              type="submit"
              style={{ marginLeft: 8 }}>
              Upload
            </button>
          </form>
        </div>

        {loading ? (
          <p>Loading images...</p>
        ) : images.length === 0 ? (
          <p>No images uploaded yet.</p>
        ) : (
          <div className="images-grid">
            {images.map((img) => (
              <div key={img.id} className="image-card">
                <img
                  src={
                    img.image_path
                      ? `${apiClient.API_ROOT}${img.image_path}`
                      : ""
                  }
                  alt="img"
                  className="image-preview"
                />
                <div className="image-info">
                  <p>{img.image_path}</p>
                  <div className="image-actions">
                    <button
                      className="btn btn-danger-small"
                      type="button"
                      onClick={() => deleteImage(img.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminImages;
