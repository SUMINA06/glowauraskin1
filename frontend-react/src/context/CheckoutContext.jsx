import React, { createContext, useState } from "react";

export const CheckoutContext = createContext();

export const CheckoutProvider = ({ children }) => {
  const [paymentMethod, setPaymentMethod] = useState("esewa"); // 'esewa' or 'khalti'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  return (
    <CheckoutContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        isProcessing,
        setIsProcessing,
        paymentError,
        setPaymentError,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};
