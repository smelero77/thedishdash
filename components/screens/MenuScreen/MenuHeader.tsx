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
        paddingTop: 'calc(var(--safe-area-top) + 1rem)',
        paddingBottom: '0.5rem',
        width: '100%',
        maxWidth: '100vw',
        ...style,
      }}
    >
      <div className="flex items-center h-16 flex-shrink-0">
        <button
          onClick={() => setSearchActive(true)}
          className={`w-16 h-16 flex items-center justify-center transition-opacity ${
            searchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <Search size={32} strokeWidth={2.5} color="#4f968f" />
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <div className="h-16 flex items-center w-[200px]">
          <TextLogoSvg className="h-12 w-auto" />
        </div>
      </div>

      <div className="flex items-center h-16 flex-shrink-0">
        <div className="w-16 h-16 flex items-center justify-center">
          <ChatButton onClick={onChat} />
        </div>
      </div>
    </header>
  ),
);

MenuHeaderComponent.displayName = 'MenuHeader';
export default React.memo(MenuHeaderComponent);
