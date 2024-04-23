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

  async function fetchUserDetails() {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({
      value: doc.id,
      label: doc.data().email
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
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onClick={() => setShowModal(true)}>
        Create Event
      </button>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                Start Date:
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                End Date:
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rbac">
                RBAC:
              </label>
              <Select
                id="rbac"
                value={formData.rbac}
                onChange={handleSelectChange}
                options={userEmails}
                className="basic-multi-select"
                classNamePrefix="select"
                isMulti={true}
                isClearable={true}
                isSearchable={true}
                placeholder="Select roles..."
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Name:
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="location">
                Location:
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="location" type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attendees">
                Attendees:
              </label>
              <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="attendees" type="number" value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value, 10) })} />
            </div>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">
              Create Event
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
