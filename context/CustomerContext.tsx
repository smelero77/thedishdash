'use client'

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface CustomerContextType {
  alias: string | null;
  isLoading: boolean;
  saveAlias: (alias: string) => Promise<boolean>;
  clearCustomerAlias: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [alias, setAlias] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar alias del localStorage al inicio
  useEffect(() => {
    const savedAlias = localStorage.getItem('customerAlias');
    if (savedAlias) {
      setAlias(savedAlias);
    }
  }, []);

  const saveAlias = async (newAlias: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      localStorage.setItem('customerAlias', newAlias);
      setAlias(newAlias);
      return true;
    } catch (error) {
      console.error('Error saving alias:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCustomerAlias = () => {
    localStorage.removeItem('customerAlias');
    setAlias(null);
  };

  return (
    <CustomerContext.Provider value={{ alias, isLoading, saveAlias, clearCustomerAlias }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
} 