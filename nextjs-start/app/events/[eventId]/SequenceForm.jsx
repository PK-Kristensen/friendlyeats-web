"use client";
import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
  arrayUnion,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../src/lib/firebase/firebase";

const SequenceForm = ({ eventId, eventDay, user }) => {
  const [sequenceData, setSequenceData] = useState({
    header: "",
    durationMinutes: "",
    startTime: "",
    index: 0,
    description: "",
  });
  useEffect(() => {
    // Create a reference to the sequences collection, ordered by endTime
    const sequencesRef = collection(
      db,
      "events",
      eventId,
      "eventDays",
      eventDay.id,
      "sequences"
    );
    const q = query(sequencesRef, orderBy("endTime", "desc"), limit(1));

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const lastSequence = querySnapshot.docs[0].data();
          setSequenceData((prevData) => ({
            ...prevData,
            startTime: lastSequence.endTime || "",
            index: lastSequence.index + 1,
          }));
        }
      },
      (error) => {
        console.error("Error fetching sequences:", error);
      }
    );

    // Unsubscribe from updates when the component unmounts
    return unsubscribe;
  }, [eventId, eventDay.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSequenceData({ ...sequenceData, [name]: value });
  };

  const eventRef = doc(db, "events", eventId);


  const logChange = async (docRef, logEntry) => {
    try {
      // Add the log entry without the timestamp
      await updateDoc(docRef, {
        eventLogs: arrayUnion(logEntry),
        // Update the 'lastUpdated' field with the serverTimestamp
        lastUpdated: serverTimestamp(),
      });
  
      // Then, set the timestamp for the last log entry separately
      const eventSnapshot = await getDoc(docRef);
      const logs = eventSnapshot.data().eventLogs;
      logs[logs.length - 1].timestamp = serverTimestamp(); // Set timestamp to the last log entry
      await updateDoc(docRef, { eventLogs: logs }); // Update the logs with the new timestamp
  
    } catch (error) {
      console.error("Error updating event logs:", error);
    }
  };
  

  const handleSubmit = async (e) => {

    e.preventDefault();
    const durationMinutes =
      sequenceData.durationMinutes === ""
        ? 0
        : parseInt(sequenceData.durationMinutes, 10);
    let [hours, minutes] = sequenceData.startTime.split(":").map(Number);

    minutes += durationMinutes;
    hours += Math.floor(minutes / 60); // increment hours if minutes are more than 59
    minutes %= 60; // get the remainder of minutes after dividing by 60
    hours %= 24; // ensure hours wrap around if they exceed 23

    const formattedEndTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    try {
      await addDoc(
        collection(
          db,
          "events",
          eventId,
          "eventDays",
          eventDay.id,
          "sequences"
        ),
        {
          ...sequenceData,
          durationMinutes,
          endTime: formattedEndTime,
          createdAt: serverTimestamp(),
        }
      );

      const newLogEntry = {
        action: "addSequence",
        details: `Ny sekvens med tittel '${sequenceData.header}' ble lagt til`,
        user: user, // The user who performed the action
        timestamp: new Date().toISOString() // Using ISO string format for the timestamp
        // Don't add the timestamp here
      };
      
      // Call logChange to append the new log entry and update the timestamp
      await logChange(eventRef, newLogEntry);

      // Reset state for the next sequence
      setSequenceData({
        header: "",
        durationMinutes: "",
        startTime: formattedEndTime,
        index: sequenceData.index + 1,
      });
    } catch (error) {
      console.error("Error adding sequence:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded-lg shadow-md mt-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-1">
          <label
            htmlFor="Ny sekvens"
            className="text-sm font-medium text-blue-700 text-center pt-5"
          >
            Ny sekvens
          </label>
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700"
          >
            Oppstart
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            value={sequenceData.startTime}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
            style={{ fontSize: '0.8rem' }} // Inline style for font-size
          />
        </div>
        <div className="md:col-span-2">
          <label
            htmlFor="durationMinutes"
            className="block text-sm font-medium text-gray-700"
          >
            Varighet
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            value={sequenceData.durationMinutes}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Minutter"
            min="0"
            required
            style={{ fontSize: '0.8rem' }} // Inline style for font-size
          />
        </div>
        <div className="md:col-span-6">
          <label
            htmlFor="header"
            className="block text-sm font-medium text-gray-700"
          >
            Sekvens tittel
          </label>
          <input
            id="header"
            name="header"
            value={sequenceData.header}
            onChange={handleChange}
            className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Sekvens tittel"
            style={{ fontSize: '0.8rem' }} // Inline style for font-size
          />
        </div>
      </div>
      <div className="mt-2 text-right">
        <button
          type="submit"
          className="inline-flex justify-center px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          style={{ fontSize: '0.8rem' }} // Inline style for font-size
        >
          Legg til sekvens
        </button>
      </div>
    </form>
  );
  
};

export default SequenceForm;
