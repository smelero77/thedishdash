import React from 'react';

export const TextLogoSvg: React.FC<React.SVGProps<SVGSVGElement>> = props => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 400 80"
    {...props}
  >
    <text
      x="0"
      y="60"
      fontFamily="Inter, sans-serif"
      fontSize="60"
      fontWeight="800"
      fill="#000000"
    >
      El Gourmet
      <tspan fill="#1ce3cf">ó</tspan>n
    </text>
  </svg>
); 