"use client";
import React, { useState, useEffect } from "react";
import {
  onSnapshot,
  addDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../../src/lib/firebase/firebase";
import EventDay from "./EventDay";
import EventDaySlim from "./EventDaySlim";
import EventForm from "./EventForm";
import { useEventPlan } from "./EventPlanContext";
import TagManager from "./TagManager";
import {
  PrinterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  ViewColumnsIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import SequenceTable from "./SequenceTable";

const EventPlan = ({ eventId, user }) => {
  const router = useRouter();
  const { eventDays } = useEventPlan();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCheckIcon, setShowCheckIcon] = useState(false);
  const [showPlan, setShowPlan] = useState(true); 
  const [selectedEventDay, setSelectedEventDay] = useState('all');
  const [filteredEventDays, setFilteredEventDays] = useState([]);

  useEffect(() => {
    const sortedEventDays = eventDays.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (selectedEventDay === 'all') {
      setFilteredEventDays(sortedEventDays);
    } else {
      setFilteredEventDays(sortedEventDays.filter(eventDay => eventDay.title === selectedEventDay));
    }
  }, [eventDays, selectedEventDay]);

  const handleDropdownChange = (event) => {
    setSelectedEventDay(event.target.value);
  };

  console.log("eventDays:", eventDays);

  const addEventDay = async (newEventDay) => {
    try {
      // Add the new event day to Firestore
      const docRef = await addDoc(
        collection(db, "events", eventId, "eventDays"),
        {
          ...newEventDay,
          createdAt: serverTimestamp(),
        }
      );

      // Create an initial empty sequence for the new event day
      await addDoc(
        collection(db, "events", eventId, "eventDays", docRef.id, "sequences"),
        {
          header: "",
          durationMinutes: "0",
          startTime: "00:00", // Default start time
          endTime: "00:00", // Default end time
          index: 0, // Starting index
          createdAt: serverTimestamp(),
          description: "",
        }
      );
    } catch (error) {
      console.error("Error adding event day or initial sequence:", error);
    }
  };

  const toggleView = () => setShowPlan(!showPlan);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  /*
  const handlePrintButtonClick = () => {
    router.push(`http://localhost:3000/${eventId}/program`);
  };
*/
  const handlePrintButtonClick = () => {
    router.push(
      `https://nextjs-dashboard-pk-kristensen.vercel.app/${eventId}/program`
    );
  };

  const handleAppButtonClick = async () => {
    try {
      const programData = eventDays.map((eventDay) => ({
        date: eventDay.date.toISOString(),
        title: eventDay.title || "",
        sequences: eventDay.sequences.map((sequence) => ({
          startTime: sequence.startTime || "",
          endTime: sequence.endTime || "",
          header: sequence.header || "",
          description: sequence.description || "",
          durationMinutes: sequence.durationMinutes || "0",
        })),
      }));

      // Create a new document in the mobileApp collection
      const mobileAppProjectCollectionRef = collection(
        db,
        "mobileApp",
        eventId,
        "programs"
      );
      // Add the new program data as a new document under the project ID
      const docRef = await addDoc(mobileAppProjectCollectionRef, {
        createdAt: serverTimestamp(),
        program: programData,
      });

      // If document was successfully created, show a check icon for 3 seconds

      if (docRef.id) {
        setShowCheckIcon(true);
        setTimeout(() => {
          setShowCheckIcon(false);
        }, 3000);
      } else {
        console.log("Error posting program to app");
      }
    } catch (error) {
      console.error("Error posting program to app:", error);
    }
  };

  return (
    <div className="relative container rounded-lg bg-white p-0 shadow-md sm:p-6">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-xl mb-4">Kjøreplan</h1>
        <select onChange={handleDropdownChange} value={selectedEventDay} className="border-gray-300 rounded">
          <option value="all">Alle dager</option>
          {eventDays.map((eventDay) => (
            <option key={eventDay.id} value={eventDay.title}>
              {eventDay.title}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute right-0 top-4 flex items-center space-x-4 mx-6">
        <div className="flex items-center space-x-4">
          {/*
          {showCheckIcon ? (
            <CheckIcon
              aria-label="Program posted to app"
              className="h-6 w-6 cursor-pointer text-green-600 hover:text-green-700"
              onClick={handleAppButtonClick}
            />
          ) : (
            <DevicePhoneMobileIcon
              aria-label="Post program to app"
              className="h-6 w-6 cursor-pointer text-blue-600 hover:text-blue-700"
              onClick={handleAppButtonClick}
            />
          )}
          <PrinterIcon
            onClick={handlePrintButtonClick}
            className="h-6 w-6 cursor-pointer text-blue-600 hover:text-blue-700"
          />
          
        */}
          <button
            aria-label={showPlan ? "Show Sequence Table" : "Show Event Plan"}
            className="p-2 text-blue-500 hover:text-blue-700"
            onClick={toggleView}
          >
            {showPlan ? (
              <ViewColumnsIcon className="h-6 w-6" />
            ) : (
              <ViewfinderCircleIcon className="h-6 w-6" />
            )}
          </button>
          {/*
          <button onClick={toggleCollapse} className="flex items-center">
            {isCollapsed ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronUpIcon className="h-5 w-5" />
            )}
          </button>
          */}
        </div>
      </div>
      {!isCollapsed && (
        <>
          {/*<TagManager eventId={eventId} />*/}
          {showPlan
            ? filteredEventDays.map((eventDay) => (
                <EventDay
                  key={eventDay.id}
                  eventDay={eventDay}
                  eventId={eventId}
                  user={user}
                />
              ))
            : filteredEventDays.map((eventDay) => (
                <EventDaySlim
                  key={eventDay.id}
                  eventDay={eventDay}
                  eventId={eventId}
                  user={user}
                />
              ))}
        </>
      )}
      <EventForm onAddEventDay={addEventDay} />
    </div>
  );
};

export default EventPlan;
