import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CustomerContextType {
  alias: string | null;
  setAlias: (alias: string | null) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alias, setAlias] = useState<string | null>(null);

  return (
    <CustomerContext.Provider value={{ alias, setAlias }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}; 