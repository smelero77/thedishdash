import React from 'react';

interface ProductChefNotesProps {
  notes?: string;
}

const ProductChefNotes: React.FC<ProductChefNotesProps> = ({ notes }) => {
  if (!notes) return null;
  return (
    <div className="px-4 pb-2">
      <h3 className="text-sm font-semibold text-[#0e1b19] mb-1">Notas del chef</h3>
      <p className="text-sm text-[#0e1b19]">{notes}</p>
    </div>
  );
};

export default ProductChefNotes; 