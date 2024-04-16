"use client";
import React, { useState, useEffect } from "react";
import { getEventsSnapshot } from "../lib/firebase/firestore";
import { getUser } from "../lib/getUser";
import CreateEvent from "./CreateEvent";
import Link from "next/link";

export default function EventListings({ searchParams }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser(); // Assuming getUser is an async function that returns the current user

  useEffect(() => {
    // Check if a user is authenticated
    if (!user) {
      setLoading(false);
      console.log("No user authenticated");
      return;
    }
    console.log("USER authenticated", user);
    // Fetch events once the user is authenticated
    const unsubscribe = getEventsSnapshot(user, (fetchedEvents) => {
      setEvents(fetchedEvents);
      setLoading(false);
    });
    console.log("EVENTS", events);
    // Cleanup function to unsubscribe from Firestore updates when the component unmounts
    return () => unsubscribe();
  }, [user, searchParams]); // Depend on `user` and `searchParams` to refetch events

  return (
    <>
      <h1>Events</h1>
      <CreateEvent />

      <div className="event-listings">
        {loading ? (
          <p>Loading...</p>
        ) : events.length > 0 ? (
          <ul>
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/${event.id}`}>
                  {`${event.name} - ${event.startDate} to ${event.endDate}`}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </>
  );
}
