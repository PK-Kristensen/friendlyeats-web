"use client";
import React, { useState } from "react";
import EventPage from "./EventPage";
import EventLog from "./EventLog";
import FileShare from "./FileShare";
import { getUser } from "../../../src/lib/getUser";
import { EventPlanProvider } from "./EventPlanContext";
//ArrowLeftOnRectangleIcon
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Page({ params: { eventId } }) {
  const user = getUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to control sidebar visibility

  if (!user) {
    return (
      <p>
        Det ser ut som at du ikke er logget inn med en konto som har tilgang til
        eventet
      </p>
    );
  }

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <EventPlanProvider eventId={eventId}>
      <div className="flex relative">
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "mr-80" : "mr-0"
          }`} max-w-auto
        >
          <EventPage user={user.uid} eventId={eventId} />
        </div>
        <button
          onClick={toggleSidebar}
          className={`absolute top-[50vh] transform -translate-y-1/2 ${
            isSidebarOpen ? "right-80" : "right-4"
          }`}
        >
          {isSidebarOpen ? (
            <ArrowRightIcon className="h-6 w-6 transform text-blue-500" />
            ) : (
              <ArrowLeftIcon className="h-6 w-6 transform text-blue-500" />
              )}
        </button>
        <div
          className={`absolute top-0 right-0 w-80 bg-gray-100 px-4 transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <EventLog eventId={eventId} />
          <FileShare eventId={eventId} />
        </div>
      </div>
    </EventPlanProvider>
  );
}
