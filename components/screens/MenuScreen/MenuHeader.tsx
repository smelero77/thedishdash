import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Search } from 'lucide-react';
import { TableBadge } from './TableBadge';
import { TextLogoSvg } from '@/components/TextLogoSvg';
import ChatButton from '@/components/chat/ChatButton';

interface MenuHeaderProps {
  alias: string | null | undefined;
  tableNumber: number;
  onAliasClick: () => void;
  setSearchActive: (active: boolean) => void;
  onChat: () => void;
  style?: React.CSSProperties;
  searchActive?: boolean;
}

const MenuHeaderComponent = forwardRef<HTMLDivElement, MenuHeaderProps>(
  ({ alias, tableNumber, onAliasClick, setSearchActive, onChat, style, searchActive }, ref) => (
    <header
      ref={ref}
      className="menu-header flex items-center justify-between bg-white px-4 mb-2"
      style={{
        height: 'var(--header-height)',
        paddingTop: 'var(--safe-area-top)',
        paddingBottom: '0.5rem',
        width: '100%',
        maxWidth: '100vw',
        ...style,
      }}
    >
      <div className="flex items-center h-12 flex-shrink-0">
        <button
          onClick={() => setSearchActive(true)}
          className={`w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-md transition-opacity ${
            searchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Search size={24} color="#4f968f" />
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <div className="h-12 flex items-center">
          <TextLogoSvg className="h-12 w-auto" />
        </div>
      </div>

      <div className="flex items-center h-12 flex-shrink-0">
        <ChatButton onClick={onChat} />
      </div>
    </header>
  ),
);

MenuHeaderComponent.displayName = 'MenuHeader';
export default React.memo(MenuHeaderComponent);
