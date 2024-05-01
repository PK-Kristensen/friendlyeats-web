"use client";
import React, { useState, useEffect } from "react";
import {
  doc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase/firebase";
import Select from "react-select";
import debounce from "lodash.debounce";
import { arrayUnion } from "firebase/firestore";

const EventDetails = ({ event, setEvent, user }) => {
  const [formData, setFormData] = useState({
    name: event?.name || "",
    startDate: event?.startDate || "",
    endDate: event?.endDate || "",
    location: event?.location || "",
    attendees: event?.attendees || 0,
    rbac: event?.rbac || [],
  });
  const [userEmails, setUserEmails] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [rbacOptions, setRbacOptions] = useState([]);

  useEffect(() => {
    if (inputValue.length >= 3) {
      debounceFetchUsers(inputValue);
    }
  }, [inputValue]);

  // This effect converts the user IDs in event.rbac to { value, label } format
  useEffect(() => {
    const fetchRbacUsers = async () => {
      const userDocsPromises = event.rbac.map((userId) =>
        getDocs(doc(db, "users", userId))
      );
      const userDocs = await Promise.all(userDocsPromises);
      const rbacUsers = userDocs.map((userDoc) => ({
        value: userDoc.id,
        label: userDoc.data().email,
      }));
      setRbacOptions(rbacUsers);
      setFormData((prev) => ({ ...prev, rbac: rbacUsers }));
    };

    if (event.rbac && event.rbac.length > 0) {
      fetchRbacUsers();
    }
  }, [event.rbac]);

  const debounceFetchUsers = debounce(async (input) => {
    const q = query(collection(db, "users"), where("email", ">=", input));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({
      value: doc.id,
      label: doc.data().email,
    }));
    setUserEmails(users);
  }, 300);

  const handleSelectInputChange = (input) => {
    setInputValue(input);
  };

  const handleSelectChange = (selectedOptions) => {
    if (user.uid === event.createdBy) {
      setFormData({ ...formData, rbac: selectedOptions });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = async (field) => {
    if (formData[field] !== event[field]) {
      const eventRef = doc(db, "events", event.id);

      try {
        await updateDoc(eventRef, { [field]: formData[field] });
        await logChange(eventRef, field, event[field], formData[field], user); // Corrected variable access
        setEvent({ ...event, [field]: formData[field] });
      } catch (error) {
        console.error("Error updating event:", error);
      }
    }
  };

  const logChange = async (eventRef, field, oldValue, newValue, userProp) => {
    console.log("user:", userProp); // Should log the user prop
    console.log("logg:", eventRef); // Should log the user prop
    // Create the log entry
    const logEntry = {
      field,
      oldValue,
      newValue,
      user: user,
      details: `endret ${field} fra ${oldValue} til ${newValue}`,
      timestamp: new Date().toISOString(), // Using ISO string format for the timestamp
      // Don't directly use serverTimestamp() here
    };

    // Update the event document to append the new log entry
    // And separately set the timestamp using serverTimestamp
    try {
      await updateDoc(eventRef, {
        eventLogs: arrayUnion(logEntry),
        lastUpdated: serverTimestamp(), // Use serverTimestamp here
      });
      console.log("updated..:", logEntry);
    } catch (error) {
      console.error("Error updating event logs:", error);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-center mb-8">
        {event?.name || "Arrangementsdetaljer"}
      </h2>
      <div className="flex flex-wrap justify-between gap-6">
        <div className="flex flex-col gap-6 flex-1 min-w-[250px]">
          <EditableField
            label="Navn"
            value={formData.name}
            name="name"
            onBlur={handleBlur}
            onChange={handleInputChange}
          />
          <EditableField
            type="date"
            label="Startdato"
            value={formData.startDate}
            name="startDate"
            onBlur={handleBlur}
            onChange={handleInputChange}
          />
          <EditableField
            type="date"
            label="Sluttdato"
            value={formData.endDate}
            name="endDate"
            onBlur={handleBlur}
            onChange={handleInputChange}
          />
        </div>
  
        <div className="flex flex-col gap-6 flex-1 min-w-[250px]">
          <EditableField
            label="Sted"
            value={formData.location}
            name="location"
            onBlur={handleBlur}
            onChange={handleInputChange}
          />
          <EditableField
            type="number"
            label="Deltakere"
            value={formData.attendees}
            name="attendees"
            onBlur={handleBlur}
            onChange={handleInputChange}
          />
          <div className="w-full">
            <label htmlFor="rbac" className="block text-sm font-medium text-gray-700">
              Del med andre
            </label>
            <Select
              id="rbac"
              value={rbacOptions}
              onChange={handleSelectChange}
              onInputChange={handleSelectInputChange}
              options={userEmails}
              className="basic-multi-select"
              classNamePrefix="select"
              isMulti={true}
              isClearable={user.uid === event.createdBy}
              isSearchable={true}
              placeholder="Skriv for å søke..."
              noOptionsMessage={() => "Ingen resultater"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
  const EditableField = ({
    label,
    value,
    name,
    onChange,
    onBlur,
    type = "text",
  }) => (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        onBlur={() => onBlur(name)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        required
      />
    </div>
  );
  

export default EventDetails;
