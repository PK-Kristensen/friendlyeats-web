"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { db } from "../lib/firebase/firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { getUser } from "../lib/getUser";
import Modal from "./Modal";

export default function CreateEvent() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    rbac: null,
    name: "",
    location: "",
    attendees: 0,
  });
  const [userEmails, setUserEmails] = useState([]); // Store user emails for RBAC

  const user = getUser();

  // Assuming you have a function to fetch user details
  async function fetchUserDetails() {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map((doc) => ({
      value: doc.id, // Use user ID for the value
      label: doc.data().email, // Use user email for the label
    }));
  }

  useEffect(() => {
    async function fetchUserEmails() {
      const userDetails = await fetchUserDetails();
      setUserEmails(userDetails);
    }
    fetchUserEmails();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter the name of the event.");
      return;
    }

    const rbacIds = formData.rbac
      ? formData.rbac.map((option) => option.value)
      : [];

      const newEvent = {
        createdBy: user.uid,
        createdDate: new Date(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        rbac: formData.rbac ? [user.uid, ...formData.rbac.map(option => option.value)] : [user.uid],
        name: formData.name,
        location: formData.location,
        attendees: formData.attendees,
        program: [],
    };
    

    try {
      const docRef = await addDoc(collection(db, "events"), newEvent);
      console.log("Event created with ID:", docRef.id);
      setShowModal(false);
    } catch (error) {
      console.error("Error adding event:", error);
    }
  };

  const handleSelectChange = (selectedOptions) => {
    setFormData({ ...formData, rbac: selectedOptions });
  };

  return (
    <div>
      <button onClick={() => setShowModal(true)}>Create Event</button>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <label>
              Start Date:
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </label>
            <label>
              RBAC:
              <Select
                value={formData.rbac}
                onChange={handleSelectChange}
                options={userEmails}
                className="basic-multi-select"
                classNamePrefix="select"
                isMulti={true}
                isClearable={true}
                isSearchable={true}
                name="rbac"
              />
            </label>

            <label>
              Name:
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </label>
            <label>
              Location:
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </label>
            <label>
              Attendees:
              <input
                type="number"
                value={formData.attendees}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attendees: parseInt(e.target.value, 10),
                  })
                }
              />
            </label>
            <button type="submit">Create Event</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
