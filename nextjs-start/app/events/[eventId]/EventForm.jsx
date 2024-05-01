import React, { useState } from "react";

export default function EventForm({ onAddEventDay }) {
  const [eventData, setEventData] = useState({
    title: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      ...eventData,
      // Convert the string date to a Date object before saving
      date: new Date(eventData.date),
    };
    onAddEventDay(newEvent);
    setEventData({
      title: "",
      date: "",
    });
  };

  return (
    <div className="mt-2">
      <h2 className="text-lg font-medium text-gray-900">Opprett ny dag</h2>
      <form
        onSubmit={handleSubmit}
        className="mb-4 flex items-end space-x-3 rounded-lg bg-white p-4 shadow-sm"
      >
        <div className="flex-grow">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Tittel
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={eventData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="flex-grow">
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            Dato
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={eventData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-2 py-1 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Legg til ny dag
        </button>
      </form>
    </div>
  );
}
