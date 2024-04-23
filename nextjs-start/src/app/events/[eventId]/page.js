"use client";
import React from "react";
import EventPage from "./EventPage";
import EventLog from "./EventLog";
import { getUser } from "../../../lib/getUser";
import { EventPlanProvider } from "./EventPlanContext";
import FileShare  from "./FileShare";

export default function Page({ params: { eventId } }) {
  const user = getUser();
  console.log('Page user:', user);
  return (
    <div className="flex flex-start">
      <EventPlanProvider eventId={eventId}>
        <div className="flex max-w-6xl mx-auto">
          {user ? (
            <>
            <div className="flex-1">
              <EventPage user={user.uid} eventId={eventId} />
            </div>
              <div className="w-96">
                <EventLog eventId={eventId} />
                <FileShare eventId={eventId} />
              </div>
              </>
          ) : (
            <p>Det ser ut som at du ikke er logget inn med en konto som har tilgang til eventet</p>
          )}
        </div>
      </EventPlanProvider>
    </div>
  );
}
