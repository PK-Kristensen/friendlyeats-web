"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
  doc,
  writeBatch,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase/firebase";
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

const SequenceItem = ({
  sequence,
  eventId,
  eventDayId,
  onAddSequence,
  onDeleteSequence,
  user,
}) => {
  const { eventDays } = useEventPlan();
  const [tempStartTime, setTempStartTime] = useState(sequence.startTime);
  const [tempDescription, setTempDescription] = useState(sequence.description);
  const [tempDuration, setTempDuration] = useState(sequence.durationMinutes);
  const [tempHeader, setTempHeader] = useState(sequence.header);
  const [editorHtml, setEditorHtml] = useState(sequence.description);
  const [tempTags, setTempTags] = useState(sequence.tags || []);
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
    setTempHeader(sequence.header || ""); // Default to empty string if undefined
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
        tempTags
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

  const handleChangeTags = (e) => {
    // Detect when Enter is pressed or when a comma is added
    if (
      e.key === "Enter" ||
      e.key === "," ||
      e.key === " " ||
      e.key === "Tab"
    ) {
      e.preventDefault();
      let newTag = e.target.value.trim();
      // Check for duplicate tags and non-empty string
      if (newTag && !tempTags.includes(newTag)) {
        newTag = newTag.replace(/,/, ""); // Remove commas from the new tag

        // Find if the tag already exists in any of the event days
        let existingColor = null;
        eventDays.forEach((eventDay) => {
          eventDay.sequences.forEach((sequence) => {
            if (
              sequence.tags?.includes(newTag) &&
              sequence.tagsColorMap?.[newTag]
            ) {
              existingColor = sequence.tagsColorMap[newTag];
            }
          });
        });

        if (!existingColor) {
          // Generate a random color for the new tag
          existingColor = getRandomColor();
        }

        if (existingColor) {
          // Update the sequence's tags color map with the existing color
          sequence.tagsColorMap = {
            ...sequence.tagsColorMap,
            [newTag]: existingColor,
          };
        }

        setTempTags([...tempTags, newTag]);
        e.target.value = ""; // Clear the input field
        handleSubmitTags([...tempTags, newTag]); // Pass the new tags array to submit
      }
    }
  };

  const handleTagDelete = async (tagToDelete) => {
    const updatedTags = tempTags.filter((tag) => tag !== tagToDelete);
    setTempTags(updatedTags); // Update local state
    await handleSubmitTags(updatedTags); // Update Firestore
  };

  const handleSubmitTags = async (tags) => {
    const sequenceRef = doc(
      db,
      "events",
      eventId,
      "eventDays",
      eventDayId,
      "sequences",
      sequence.id
    );

    // Prepare the updated tagsColorMap
    const updatedTagsColorMap = { ...sequence.tagsColorMap };
    tags.forEach((tag) => {
      if (!updatedTagsColorMap[tag]) {
        // Assign a default color if the tag is new and doesn't have a color yet
        updatedTagsColorMap[tag] = "#FFFFFF"; // Default color, you can change this
      }
    });

    try {
      await updateDoc(sequenceRef, {
        tags: tags,
        tagsColorMap: updatedTagsColorMap,
      });
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  // Function to get the color for the sequence based on its tags
  const getBorderColorForSequence = () => {
    if (sequence.tags?.length > 0 && sequence.tagsColorMap) {
      const firstTag = sequence.tags[0];
      return sequence.tagsColorMap[firstTag] || "transparent"; // Default to 'transparent' if no color found
    }
    return "transparent"; // Default to 'transparent' if no tags
  };

  const borderColor = getBorderColorForSequence(); // Call the function to get the border color

  const renderTags = () => {
    return tempTags.map((tag, index) => {
      // Find the color for the tag from the tagsColorMap or default to a fallback color
      const tagColor = sequence.tagsColorMap[tag] || "bg-gray-200";
      return (
        <span
          key={index}
          className={`my-0.5 mr-2 inline-flex items-center rounded px-2 py-1 text-xs text-blue-800 ${tagColor}`}
          style={{ backgroundColor: tagColor }} // Apply the background color style
        >
          {tag}
          <button onClick={() => handleTagDelete(tag)} className="ml-1">
            x
          </button>
        </span>
      );
    });
  };

  return (
    <div
      className={`mb-3 rounded-lg bg-gray-100 p-1 shadow-lg sm:px-4 sm:py-1${
        borderColor && `border-t-4`
      }`}
      style={{ borderColor }} // Apply the border color style
    >
      {" "}
      <div className="grid lg:grid-cols-12 gap-0 sm:gap-2 items-start">
        {/* Index Wrapper */}
        <div className="lg:col-span-1 bg-blue-500 p-2 text-center rounded">
          <p className="text-sm font-semibold text-white">
            {sequence.index + 1}
          </p>
        </div>
        {/* Start time Wrapper */}
        <div className="lg:col-span-1 sm:col-span-2">
          <input
            id="startTime"
            type="time"
            value={tempStartTime}
            onChange={handleChangeStartTime}
            onBlur={handleBlur}
            className="sd:text-md w-full border-none bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        {/* Header Wrapper */}
        <div className="lg:col-span-10 sm:col-span-5">
          <input
            type="text"
            value={tempHeader}
            onChange={handleChangeHeader}
            onBlur={handleBlur}
            className="sm:text-md w-full border-none bg-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-0"
            placeholder="Sekvens tittel"
          />
        </div>

        {/* Duration Wrapper */}
        <div className="lg:col-span-1 col-span-2 row-span-2 hidden sm:mt-0 sm:flex sm:flex-col sm:justify-center lg:w-16 lg:mx-auto">
          <p
            htmlFor="durationMinutes"
            className="text-xs font-semibold text-gray-700"
          >
            Varighet{" "}
          </p>
          <input
            id="durationMinutes"
            type="number"
            value={tempDuration}
            onChange={handleChangeDuration}
            onBlur={handleBlur}
            className="w-full border-none bg-transparent px-0 py-0 text-sm font-semibold text-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="min"
          />
        </div>

        {/* Description Textarea Wrapper */}
        <div className="col-span-4 row-span-2 lg:col-span-10 lg:col-start-2">
          <div className={styles.quillContainer}>
            {" "}
            {/* Use the CSS module class here */}
            <ReactQuill
              value={editorHtml}
              onChange={handleQuillChange}
              onBlur={handleBlur}
              formats={formats}
              theme="bubble"
              className="border-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="notater.."
              style={{ minHeight: "5rem" }}
            />
          </div>
        </div>

        {/* End Time Display */}
        <div className="lg:col-span-1 col-span-4 row-span-2 group relative flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-gray-700">
            Slutt tid: <br />
            <span className="text-blue-500">
              {calculateEndTime(
                sequence.startTime,
                parseInt(sequence.durationMinutes, 10) || 0
              )}
            </span>
            <span className="invisible absolute bottom-full left-1/2 mb-2 w-32 -translate-x-1/2 transform rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
              Endre varighet så oppdaterer slutt tiden seg automatisk
            </span>
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() =>
                onAddSequence(sequence.index + 1, sequence.endTime)
              }
              className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" // Simple and minimalistic style
            >
              +
            </button>

            <button
              onClick={() => onDeleteSequence(sequence)}
              className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300" // Simple and minimalistic style
            >
              -
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SequenceItem;
