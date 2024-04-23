// SearchBar.jsx
'use client';
import React from 'react';

const SearchBar = ({ total, onSearch }) => {
  return (
    <div className="flex justify-between items-center ">
      <input
        type="text"
        placeholder="Søk steder..."
        onChange={e => onSearch(e.target.value)}
        className="w-full p-3 rounded border border-gray-300 focus:ring focus:ring-blue-200 focus:border-blue-500 transition ease-in-out"
      />
      <span className="ml-4 text-gray-600 text-sm">
        Totalt: {total}
      </span>
    </div>
  );
};

export default SearchBar;
