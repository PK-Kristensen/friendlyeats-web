'use client'
// EventPlanContext.js
import React, { createContext, useState, useContext } from 'react';

export const EventPlanContext = createContext({ eventDays: [], setEventDays: () => {} });

export const useEventPlan = () => useContext(EventPlanContext);

export const EventPlanProvider = ({ children }) => {
  const [eventDays, setEventDays] = useState([]);

  // ... other state and handlers ...

  return (
    <EventPlanContext.Provider value={{ eventDays, setEventDays }}>
      {children}
    </EventPlanContext.Provider>
  );
};
