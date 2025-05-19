'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

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

  useEffect(() => {
    const savedAlias = localStorage.getItem('customerAlias');
    if (savedAlias) {
      setAlias(savedAlias);
    }
  }, []);

  const saveAlias = useCallback(async (newAlias: string): Promise<boolean> => {
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
  }, []);

  const clearCustomerAlias = useCallback(() => {
    localStorage.removeItem('customerAlias');
    setAlias(null);
  }, []);

  const value = useMemo(
    () => ({
      alias,
      isLoading,
      saveAlias,
      clearCustomerAlias,
    }),
    [alias, isLoading, saveAlias, clearCustomerAlias],
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error(
      'useCustomer must be used within a <CustomerProvider>. Please wrap your component tree with <CustomerProvider>.',
    );
  }
  return context;
}
