'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface CustomerContextType {
  customerId: string | null;
  alias: string | null;
  setAlias: (alias: string) => void;
}

const CustomerContext = createContext<CustomerContextType>({
  customerId: null,
  alias: null,
  setAlias: () => {},
});

export const useCustomer = () => useContext(CustomerContext);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [alias, setAlias] = useState<string | null>(null);

  useEffect(() => {
    // Intentar recuperar el customerId del localStorage
    const storedCustomerId = localStorage.getItem('customerId');
    const storedAlias = localStorage.getItem('customerAlias');

    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
    } else {
      // Si no existe, crear uno nuevo
      const newCustomerId = uuidv4();
      localStorage.setItem('customerId', newCustomerId);
      setCustomerId(newCustomerId);
    }

    if (storedAlias) {
      setAlias(storedAlias);
    }
  }, []);

  const handleSetAlias = (newAlias: string) => {
    setAlias(newAlias);
    localStorage.setItem('customerAlias', newAlias);
  };

  return (
    <CustomerContext.Provider
      value={{
        customerId,
        alias,
        setAlias: handleSetAlias,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}; 