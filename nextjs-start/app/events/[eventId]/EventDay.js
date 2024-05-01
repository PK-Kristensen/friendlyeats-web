"use client";
import React, { useState } from "react";
import SequenceItem from "./SequenceItem";
import SequenceForm from "./SequenceForm";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../src/lib/firebase/firebase";

const EventDay = ({ eventDay, eventId, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [editedTitle, setEditedTitle] = useState(eventDay.title);
  const [editedDate, setEditedDate] = useState(
    eventDay.date.toISOString().split("T")[0]
  );

  console.log(eventDay);


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const eventDayRef = doc(db, "events", eventId, "eventDays", eventDay.id);
    await updateDoc(eventDayRef, {
      title: editedTitle,
      date: new Date(editedDate), // Convert back to Date object
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const eventDayRef = doc(db, "events", eventId, "eventDays", eventDay.id);
    await deleteDoc(eventDayRef);
    // Optionally, trigger a state update or redirect after deletion
  };

  const handleAddSequence = async (insertAtIndex, startTime) => {
    // Start a Firestore batch
    const batch = writeBatch(db);

    // Query to get all sequences with index >= insertAtIndex
    const sequencesRef = collection(
      db,
      "events",
      eventId,
      "eventDays",
      eventDay.id,
      "sequences"
    );
    const q = query(
      sequencesRef,
      orderBy("index", "asc"),
      where("index", ">=", insertAtIndex)
    );

    // Execute the query and prepare updates for each affected sequence's index
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnapshot) => {
      const sequence = docSnapshot.data();
      const sequenceRef = docSnapshot.ref;
      // Increment the index for each sequence
      batch.update(sequenceRef, { index: sequence.index + 1 });
    });

    
    // Define the new sequence to add
    const newSequence = {
      header: "",
      durationMinutes: 0,
      startTime: startTime, // This will be the endTime of the previous sequence
      endTime: startTime, // Initially, endTime will be the same as startTime
      index: insertAtIndex, // The new index where the sequence will be inserted
      createdAt: serverTimestamp(),
      description: "",
    };

    // Add the new sequence to the batch
    const newSequenceRef = doc(
      collection(db, "events", eventId, "eventDays", eventDay.id, "sequences")
    );
    batch.set(newSequenceRef, newSequence);

    // Commit the batch
    try {
      await batch.commit();
    } catch (error) {
      console.error(
        "Error adding sequence and updating subsequent sequences:",
        error
      );
    }
  };

  const handleDeleteSequence = async (sequenceToDelete) => {
    // Start a Firestore batch
    const batch = writeBatch(db);

    // Reference to the sequence to be deleted
    const sequenceRef = doc(
      db,
      "events",
      eventId,
      "eventDays",
      eventDay.id,
      "sequences",
      sequenceToDelete.id
    );

    // Delete the selected sequence
    batch.delete(sequenceRef);

    // Query to get all sequences with index > the index of the deleted sequence
    const sequencesToUpdateRef = collection(
      db,
      "events",
      eventId,
      "eventDays",
      eventDay.id,
      "sequences"
    );
    const q = query(
      sequencesToUpdateRef,
      orderBy("index", "asc"),
      where("index", ">", sequenceToDelete.index)
    );

    // Execute the query and prepare updates for each affected sequence's index
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnapshot) => {
      const sequence = docSnapshot.data();
      const sequenceRef = docSnapshot.ref;
      // Decrement the index for each sequence
      batch.update(sequenceRef, { index: sequence.index - 1 });
    });

    // Commit the batch
    try {
      await batch.commit();
    } catch (error) {
      console.error(
        "Error deleting sequence and updating subsequent sequences:",
        error
      );
    }
  };

  return (
    <div className="rounded-lg bg-blue-100 p-3 shadow-md mb-4">
      {" "}
      {/* reduced padding */}
      <div className="flex items-center justify-between">
        {isEditing ? (
          <>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="mr-2 rounded border border-gray-300 p-1 text-sm" // reduced padding and font size
            />
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
              className="rounded border border-gray-300 p-1 text-sm" // reduced padding and font size
            />
            <button
              onClick={handleSave}
              className="p-1 text-sm text-blue-600 hover:text-blue-800" // reduced font size
            >
              Lagre
            </button>
          </>
        ) : (
          <>
            <h3 className="mb-3 text-xl font-semibold">
              {" "}
              {/* reduced font size and margin */}
              {eventDay.title} -{" "}
              <span className="text-lg font-normal">
                {" "}
                {/* reduced font size */}
                {eventDay.date.toDateString()}
              </span>
            </h3>
            <div className="flex items-center">
              <button
                onClick={() => handleAddSequence(0, "00:00")}
                className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-300" // Simple and minimalistic style
              >
                +
              </button>
              <button
                onClick={handleEdit}
                className="mr-2 p-1 text-blue-600 hover:text-blue-800" // reduced margin
              >
                <PencilIcon className="h-5 w-5" /> {/* reduced icon size */}
              </button>
              {isConfirmingDelete ? (
                <div className="flex items-center">
                  <span className="mr-2 text-xs">
                    {" "}
                    {/* reduced font size */}
                    Er du sikker på at du vil slette hele denne dagen?{" "}
                  </span>
                  <button
                    onClick={handleDelete}
                    className="mr-2 rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white transition duration-200 ease-in-out hover:bg-green-700" // reduced padding and font size
                  >
                    Ja
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white transition duration-200 ease-in-out hover:bg-red-700" // reduced padding and font size
                  >
                    Nei
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-1 text-red-600 hover:text-red-800" // reduced padding
                >
                  <TrashIcon className="h-5 w-5" /> {/* reduced icon size */}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {eventDay.sequences?.map((sequence, index) => (
        <SequenceItem
          key={sequence.id}
          sequence={sequence}
          eventId={eventId}
          eventDayId={eventDay.id}
          onAddSequence={handleAddSequence}
          onDeleteSequence={handleDeleteSequence}
          user={user}
        />
      ))}
      <SequenceForm eventId={eventId} eventDay={eventDay} user={user}/>
    </div>
  );
};

export default EventDay;
