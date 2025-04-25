"use client";

import React from 'react';

interface TableIconProps {
  tableNumber: number;
  size?: number;
}

export default function TableIcon({ tableNumber, size = 24 }: TableIconProps) {
  return (
    <div className="flex flex-col items-center justify-center text-black">
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="white" />
        <line x1="16" y1="18" x2="16" y2="40" stroke="currentColor" strokeWidth="2" />
        <rect x="18" y="20" width="28" height="4" fill="currentColor" />
        <line x1="24" y1="24" x2="24" y2="40" stroke="currentColor" strokeWidth="2" />
        <line x1="44" y1="24" x2="44" y2="40" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="14" r="2" fill="currentColor" />
        <rect x="14" y="40" width="4" height="10" fill="currentColor" />
        <rect x="22" y="40" width="4" height="10" fill="currentColor" />
        <rect x="42" y="40" width="4" height="10" fill="currentColor" />
      </svg>
      <span className="text-xs font-semibold mt-1">Mesa {tableNumber}</span>
    </div>
  );
} 