import React, { useState } from 'react';

const AISuggestionBox = ({ onGetSuggestions }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onGetSuggestions(inputValue);
    setInputValue(''); // Clear input after submission
  };

  return (
    <div className="relative inset-0 flex flex-col items-center justify-center p-6 bg-black bg-opacity-0 rounded-lg ">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Get AI-driven Event Suggestions</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type your event ideas..."
          className="w-full p-2 rounded-md text-gray-900 border border-gray-300 focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="mt-3 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow">
          Suggest
        </button>
      </form>
    </div>
  );
};

export default AISuggestionBox;
