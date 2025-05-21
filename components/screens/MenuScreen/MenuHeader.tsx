import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Search, MessageSquare } from 'lucide-react';
import { TableBadge } from './TableBadge';
import { TextLogoSvg } from '@/components/TextLogoSvg';

interface MenuHeaderProps {
  alias: string | null | undefined;
  tableNumber: number;
  onAliasClick: () => void;
  setSearchActive: (active: boolean) => void;
  onChat?: () => void;
  style?: React.CSSProperties;
  searchActive?: boolean;
}

const MenuHeaderComponent = forwardRef<HTMLDivElement, MenuHeaderProps>(
  ({ alias, tableNumber, onAliasClick, setSearchActive, onChat, style, searchActive }, ref) => (
    <header
      ref={ref}
      className="sticky top-0 z-50 flex items-center justify-between bg-white/95 backdrop-blur py-0 px-4 h-14 mb-0"
      style={{ paddingTop: 'env(safe-area-inset-top)', ...style }}
    >
      {/* �� Búsqueda */}
      <button
        onClick={() => setSearchActive(true)}
        className={`w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md transition-opacity ${
          searchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <Search size={22} color="#4f968f" />
      </button>

      {/* Logo centrado */}
      <div className="flex-1 flex justify-center">
        <div className="h-12 w-auto mb-0 pb-0">
          <TextLogoSvg className="h-full w-auto" />
        </div>
      </div>

      {/* Alias + Mesa + Chat */}
      <div className="flex items-center space-x-3">
        {/* Mesa integrada en icono */}
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-white shadow-md w-10 h-10 flex items-center justify-center">
            <span className="text-[#4f968f] text-lg font-bold">{tableNumber}</span>
          </div>
        </div>

        {/* Chat opcional */}
        {onChat && (
          <button onClick={onChat} className="p-1">
            <MessageSquare size={20} color="#1ce3cf" />
          </button>
        )}
      </div>
    </header>
  ),
);

MenuHeaderComponent.displayName = 'MenuHeader';
export default React.memo(MenuHeaderComponent);
