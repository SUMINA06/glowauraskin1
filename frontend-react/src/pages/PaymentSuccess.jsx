import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get("order") || "N/A";
  const amount = searchParams.get("amount") || "0.00";
  const paymentStatus = searchParams.get("status") || "Paid";
  const paymentMethod = searchParams.get("method") || "eSewa";
  const [proof, setProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    if (!proof) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(proof);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  const uploadProof = async () => {
    if (!proof || !orderNumber || orderNumber === "N/A") return;
    setUploading(true);
    setUploadMessage("");
    try {
      await apiClient.uploadPaymentProof(orderNumber, proof);
      setUploadMessage("Payment proof uploaded successfully.");
    } catch (error) {
      setUploadMessage(
        error.response?.data?.message || "Failed to upload payment proof.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-success">
        <div className="success-container">
          <div className="success-icon">✓</div>
          <h2>Payment Successful</h2>
          <p>Your payment has been successfully received.</p>
          <p className="order-id">Order Number: {orderNumber}</p>
          <p className="order-id">Payment Method: {paymentMethod}</p>
          <p className="order-id">Payment Status: {paymentStatus}</p>
          <p className="order-id">Amount Paid: Rs {amount}</p>
          {paymentMethod.toLowerCase() !== "cod" && (
            <div className="payment-proof-upload">
              <p className="order-id">Upload Payment Proof</p>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setProof(event.target.files?.[0] || null)}
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Payment proof preview"
                  style={{ maxWidth: "240px", maxHeight: "180px", marginTop: "12px" }}
                />
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={uploadProof}
                disabled={!proof || uploading}
              >
                {uploading ? "Uploading..." : "Upload Payment Proof"}
              </button>
              {uploadMessage && <p className="order-id">{uploadMessage}</p>}
            </div>
          )}
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PaymentSuccess;
