"use client";
import React, { useState, useEffect } from "react";
import { getEventsSnapshot, Timestamp } from "../lib/firebase/firestore";
import { getUser } from "../lib/getUser";
import CreateEvent from "./CreateEvent";
import Link from "next/link";
import { BellIcon, UserGroupIcon } from "@heroicons/react/24/outline"; // Import the icons from Heroicons
import { formatDistanceToNow } from 'date-fns';

const isValidDate = (dateString) => {
  const dateParts = dateString.split(".");
  if (dateParts.length !== 3) return false;

  const day = parseInt(dateParts[0], 10);
  const month = parseInt(dateParts[1], 10) - 1; // Måned indeks er 0-basert i JavaScript
  const year = parseInt(dateParts[2], 10);

  const date = new Date(year, month, day);
  return date instanceof Date && !isNaN(date);
};

const getDaysUntilEvent = (dateString) => {
  if (!isValidDate(dateString)) return null;

  const now = new Date();
  const dateParts = dateString.split(".");
  const eventDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
  const timeDiff = eventDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

const formatEventStartInfo = (dateString) => {
  const daysUntilEvent = getDaysUntilEvent(dateString);

  if (daysUntilEvent === null) {
    return "Ugyldig startdato";
  } else if (daysUntilEvent < 0) {
    return "Arrangementet har vært";
  } else if (daysUntilEvent < 10) {
    return daysUntilEvent === 1
      ? "1 dag til arrangementet"
      : `${daysUntilEvent} dager til arrangementet`;
  } else {
    // Returnerer den opprinnelige datoen hvis det er 10 dager eller mer til arrangementet
    return dateString;
  }
};

export default function EventListings({ searchParams }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getUser(); // Assuming getUser is an async function that returns the current user


  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
  
    let isSubscribed = true;
  
    getEventsSnapshot(user, (fetchedEvents) => {
      if (isSubscribed) {
        const sortedEvents = fetchedEvents.sort((a, b) => {
          // Convert Firestore Timestamps to JavaScript Date objects and sort in descending order
          const dateA = a.startDate.toDate ? a.startDate.toDate() : a.startDate;
          const dateB = b.startDate.toDate ? b.startDate.toDate() : b.startDate;
          return dateB - dateA;
        }).map(event => ({
          ...event,
          // Format lastUpdated to a "time ago" format if it exists
          lastUpdatedRelative: event.lastUpdated
            ? formatDistanceToNow(event.lastUpdated.toDate ? event.lastUpdated.toDate() : event.lastUpdated, { addSuffix: true })
            : 'N/A'
        }));
        
        setEvents(sortedEvents);
        setLoading(false);
      }
    })
    .catch((error) => {
      console.error("Failed to fetch events or set up unsubscribe:", error);
      setLoading(false);
    });
  
    return () => {
      isSubscribed = false;
    };
  }, [user, searchParams]);
  

  return (
    <div className="my-4 mx-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Events</h1>
        <CreateEvent />
      </div>
      <div className="flex flex-wrap flex-start gap-4">
        {loading ? (
          <p>Loading...</p>
        ) : events.length > 0 ? (
          events.map((event) => {
            const lastUpdatedString = event.lastUpdated
              ? formatDistanceToNow(new Date(event.lastUpdated.seconds * 1000), { addSuffix: true })
              : 'N/A';
            return(
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300 p-4 relative" style={{ width: "16rem", height: "10rem" }}>
                  <h3 className="text-lg font-semibold">{event.name}</h3>
                  <p className="text-gray-600 mb-8">
                    {formatEventStartInfo(event.startDate)}
                  </p>
                  <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-sm text-gray-500">
                    <BellIcon className="h-4 w-4" />
                    <span>{lastUpdatedString}</span>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{event.attendees}</span>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <p>No events found.</p>
        )}
      </div>
    </div>
  );
  
}
