import React from 'react';
import { Table as TableIcon } from 'lucide-react';

interface TableBadgeProps {
  tableNumber: number | string;
  size?: number;
  color?: string;
}

export const TableBadge: React.FC<TableBadgeProps> = ({
  tableNumber,
  size = 24,
  color = '#1ce3cf',
}) => (
  <div className="relative inline-flex">
    <TableIcon size={size} color={color} />
    <span
      className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ pointerEvents: 'none' }}
    >
      {tableNumber}
    </span>
  </div>
);
