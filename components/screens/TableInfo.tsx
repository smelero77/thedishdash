import React from 'react';

interface TableInfoProps {
  tableNumber: number;
}

const TableInfo: React.FC<TableInfoProps> = ({ tableNumber }) => {
  return (
    <div className="px-4 mb-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Mesa {tableNumber}</h2>
          </div>
          <div className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
            Activa
          </div>
        </div>
      </div>
    </div>
  );
}

export default TableInfo; 