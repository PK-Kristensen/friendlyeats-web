"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useTable, useSortBy } from "react-table";
import { db } from "../../../lib/firebase/firebase";
import {
  doc,
  writeBatch,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import "tailwindcss/tailwind.css";
import debounce from "lodash/debounce";
import {
  calculateEndTime,
  calculateDuration,
  getRandomColor,
} from "../../../lib/utilsFunctions";
import { useEventPlan } from "./EventPlanContext";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Include the Quill CSS
import "react-quill/dist/quill.bubble.css";
import styles from "./SequenceItem.module.css";

const SequenceTable = ({
  sequence,
  eventId,
  eventDayId,
  onAddSequence,
  onDeleteSequence,
  user,
}) => {
  console.log("sequence table: ", sequence);
  const { eventDays } = useEventPlan();
  const [tempStartTime, setTempStartTime] = useState(sequence.startTime);
  const [tempDescription, setTempDescription] = useState(sequence.description);
  const [tempDuration, setTempDuration] = useState(sequence.durationMinutes);
  const [tempHeader, setTempHeader] = useState(sequence.header);
  const [editorHtml, setEditorHtml] = useState(sequence.description);
  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    //'image',
    //'video',
  ];

  useEffect(() => {
    setTempStartTime(sequence.startTime);
    setTempDescription(sequence.description);
    setTempDuration(sequence.durationMinutes);
    setTempHeader(sequence.header);
  }, [
    sequence.description,
    sequence.durationMinutes,
    sequence.header,
    sequence.startTime,
  ]);

  useEffect(() => {
    setTempStartTime(sequence.startTime || ""); // Default to empty string if undefined
    setTempDescription(sequence.description || ""); // Default to empty string if undefined
    setTempDuration(sequence.durationMinutes || 0); // Default to 0 if undefined
  }, [sequence]);

  const updateFirestore = useCallback(
    debounce(
      (newStartTime, newEndTime, newHeader, newDuration, newDescription) => {
        // Find the current event day
        const eventDay = eventDays.find((ed) => ed.id === eventDayId);
        const subsequentSequences = eventDay.sequences.filter(
          (seq) => seq.index > sequence.index
        );

        const batch = writeBatch(db);

        // Update the current sequence
        const sequenceRef = doc(
          db,
          "events",
          eventId,
          "eventDays",
          eventDayId,
          "sequences",
          sequence.id
        );
        batch.update(sequenceRef, {
          startTime: newStartTime,
          endTime: newEndTime,
          header: newHeader,
          durationMinutes: newDuration,
          description: newDescription,
        });

        let nextStartTime = newEndTime;

        // Update each subsequent sequence)
        subsequentSequences.forEach((subsequentSeq) => {
          const seqRef = doc(
            db,
            "events",
            eventId,
            "eventDays",
            eventDayId,
            "sequences",
            subsequentSeq.id
          );
          const seqNewEndTime = calculateEndTime(
            nextStartTime,
            subsequentSeq.durationMinutes
          );
          batch.update(seqRef, {
            startTime: nextStartTime,
            endTime: seqNewEndTime,
          });
          nextStartTime = seqNewEndTime; // Set next sequence's start time to the end time of the current sequence
        });

        return batch
          .commit()
          .catch((error) => console.error("Error updating sequences:", error));
      },
      500
    ),
    [sequence, eventDayId, eventDays]
  );

  const handleBlur = async () => {
    const newEndTime = calculateEndTime(tempStartTime, tempDuration);
    if (tempDescription == undefined) {
      setTempDescription("");
    }
    try {
      // Perform the Firestore batch update and wait for it to complete
      await updateFirestore(
        tempStartTime,
        newEndTime,
        tempHeader,
        tempDuration,
        tempDescription,
      );

      let docRef = doc(db, "events", eventId);

      await logChange(docRef, {
        action: "updateSequence",
        details:
          sequence.header !== tempHeader
            ? `endret tittel fra '${sequence.header}' til '${tempHeader}'`
            : sequence.startTime !== tempStartTime
            ? `endret starttid fra '${sequence.startTime}' til '${tempStartTime}'`
            : sequence.durationMinutes !== tempDuration
            ? `endret varighet fra '${sequence.durationMinutes}' til '${tempDuration}'`
            : sequence.description !== tempDescription
            ? `endret beskrivelse fra '${sequence.description}' til '${tempDescription}'`
            : // : sequence.tags !== tempTags
              //          ? `endret tags fra '${sequence.tags}' til '${tempTags}'`
              `endret sekvens`,
        user: user, // Assuming you have user details available
        timestamp: new Date().toISOString(), // Using ISO string format for the timestamp
      });
      // No need to manually fetch sequences as onSnapshot will update state
    } catch (error) {
      console.error("Error updating sequences:", error);
    }
  };

  const logChange = async (docRef, changeDetails) => {
    try {
      // Check each field in changeDetails for undefined values and replace them
      Object.keys(changeDetails).forEach((key) => {
        if (changeDetails[key] === undefined) {
          changeDetails[key] = null; // or some other sensible default
        }
      });

      // Prepare the log entry with a timestamp
      const logEntry = {
        ...changeDetails,
        timestamp: new Date().toISOString(), // Ensuring all fields are defined
      };

      // Retrieve the current document to append to the array
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        // Get current logs array and append new log entry
        const currentLogs = docSnapshot.data().eventLogs || [];
        const updatedLogs = [...currentLogs, logEntry];

        // Update the document with the new logs array
        await updateDoc(docRef, {
          eventLogs: updatedLogs,
          lastUpdated: serverTimestamp(),
        });
      } else {
        console.log("Document does not exist!");
      }
    } catch (error) {
      console.error("Error logging changes:", error);
    }
  };

  const handleChangeStartTime = (e) => {
    setTempStartTime(e.target.value);
  };

  const handleChangeDuration = (e) => {
    setTempDuration(e.target.value);
  };

  const handleChangeHeader = (e) => {
    setTempHeader(e.target.value);
  };

  const handleQuillChange = (content) => {
    setEditorHtml(content);
    // Update the description in your sequence object or state if needed
    setTempDescription(content);
  };

  return (
    <tr>
      <td className="pl-4 py-0 whitespace-nowrap" style={{ fontSize: '0.8rem' }}>{sequence.index + 1}</td>
      <td className="px-4 py-0 whitespace-nowrap">
        <input
          type="time"
          value={tempStartTime}
          onChange={handleChangeStartTime}
          onBlur={handleBlur}
          style={{ fontSize: "0.8rem" }}

        />
      </td>
      <td className="pl-4 py-0 whitespace-nowrap text-blue-500" style={{ fontSize: '0.8rem' }}>
        {calculateEndTime(tempStartTime, sequence.durationMinutes || 0)}
      </td>
      <td className="px-4 py-0 whitespace-nowrap">
        <input
          type="number"
          value={tempDuration}
          onChange={handleChangeDuration}
          onBlur={handleBlur}
          style={{ fontSize: "0.8rem", maxWidth: "7rem"}}
        />
      </td>
      <td className="pl-4 py-0 whitespace-nowrap">
        <input
          type="text"
          value={tempHeader}
          onChange={handleChangeHeader}
          onBlur={handleBlur}
          style={{ fontSize: "0.8rem" }}
        />
      </td>
      <td className="px-0 py-0 whitespace-nowrap">
        <div className={styles.quillContainer}>
          <ReactQuill
            value={editorHtml}
            onChange={handleQuillChange}
            onBlur={handleBlur}
            theme="bubble"
            className="border-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="Notes..."
            style={{ minHeight: "1rem", minWidth: "10rem"}}
          />
        </div>
      </td>
    </tr>
  );
};

export default SequenceTable;
