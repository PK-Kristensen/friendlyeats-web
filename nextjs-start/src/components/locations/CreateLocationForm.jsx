"use client";
import React, { useState } from "react";
import Modal from "../Modal";
import Select from "react-select";
import { db, storage } from "../../lib/firebase/firebase";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Autocomplete from "react-google-autocomplete";

const fieldConfig = [
  {
    category: "generalInfo",
    label: "Generell Informasjon",
    fields: [
      { key: "name", label: "Navn på stedet", type: "text" },
      { key: "description", label: "Beskrivelse", type: "textarea" },
      { key: "price", label: "Pris", type: "number" },
    ],
  },
  {
    category: "address",
    label: "Sted / Adresse",
    fields: [{ key: "location", label: "Adresse", type: "autocomplete" }],
  },
  {
    category: "matOgDrikke",
    label: "Mat og Drikke",
    type: "multi-select",
    options: [
      { key: "alkoholPåStedet", label: "Alkohol kan nytes på stedet" },
      { key: "alkoholTilbys", label: "Alkohol tilbys gjennom utleier" },
      { key: "matservering", label: "Utleier tilbyr matservering" },
    ],
  },
  {
    category: "fasiliteter",
    label: "Fasiliteter",
    type: "multi-select",
    options: [
      { key: "scene", label: "Scene" },
      { key: "dansegulv", label: "Dansegulv" },
      { key: "parkering", label: "Parkering" },
      { key: "chambreSeparée", label: "Chambre séparée" },
      { key: "barnevennlig", label: "Barnevennlig" },
    ],
  },
  {
    category: "kapasitet",
    label: "Kapasitet",
    fields: [
      { key: "sitteplasser", label: "Sitteplasser", type: "number" },
      { key: "ståplasser", label: "Ståplasser", type: "number" },
      { key: "areal", label: "Areal (m²)", type: "number" },
    ],
  },
  {
    category: "aldersgrense",
    label: "Aldersgrense for leie",
    type: "multi-select",
    options: [{ key: "18år", label: "18 år" }],
  },
  {
    category: "anledninger",
    label: "Lokalet passer til",
    type: "multi-select",
    options: [
      { key: "dåpNavnedag", label: "Dåp / navnedag" },
      { key: "konfirmasjon", label: "Konfirmasjon" },
      { key: "bedriftsmiddag", label: "Bedriftsmiddag" },
      { key: "bedriftsarrangement", label: "Bedriftsarrangement" },
      { key: "julebord", label: "Julebord" },
      { key: "møte", label: "Møte" },
      { key: "nettverking", label: "Nettverking" },
      { key: "lønningspils", label: "Lønningspils" },
    ],
  },
];

const CreateLocationForm = ({}) => {
  const [formData, setFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [images, setImages] = useState([]);

  const onPlaceSelected = (place) => {
    // Log the place object for debugging
    //NOT WORKING properly!!!!___________________________________________
    console.log("place", place);

    // Get the address components and place ID
    const address = place.formatted_address;
    const placeId = place.place_id;
    const name = place.name;
    const types = place.types;
    console.log("HER", name, types);

    // Update the address information
    handleInputChange("address", "locationAddress", address);
    handleInputChange("address", "locationPlaceId", placeId);

    // If the place has a name and it's of a certain type, consider pre-filling the 'name' field
    if (name && types.includes("establishment")) {
      handleInputChange("generalInfo", "name", name);
    }

    // Additional logic to pre-fill other form fields could go here
  };

  const handleInputChange = (category, key, value) => {
    console.log(category, key, value);
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleMultiSelectChange = (category, options) => {
    setFormData((prev) => ({
      ...prev,
      [category]: options ? options.map((option) => option.key) : [],
    }));
  };

  const handleImageChange = (event) => {
    setImages([...event.target.files]);
  };

  const uploadImages = async (locationId) => {
    const uploadPromises = images.map((image) => {
      const imageRef = ref(storage, `locations/${locationId}/${image.name}`);
      return uploadBytes(imageRef, image).then(() => getDownloadURL(imageRef));
    });
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "locations"), formData);
      const imageUrls = await uploadImages(docRef.id);
      await updateDoc(doc(db, "locations", docRef.id), { images: imageUrls });
      console.log("Location created with ID:", docRef.id);
      setShowModal(false);
    } catch (error) {
      console.error("Error adding location and images: ", error);
    }
  };

  const renderField = (category, field) => {
    const fieldValue = formData[category]?.[field.key] || "";

    if (field.type === "multi-select") {
      return (
        <div key={field.label} className="col-span-2">
          <label className="block">
            <span className="text-gray-700">{field.label}</span>
            <Select
              isMulti
              name={category}
              value={field.options.filter((option) =>
                formData[category]?.includes(option.key)
              )}
              onChange={(options) => handleMultiSelectChange(category, options)}
              options={field.options}
              className="basic-multi-select mt-1"
              classNamePrefix="select"
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.key}
            />
          </label>
        </div>
      );
    } else if (field.type === "autocomplete") {
      return (
        <label key={field.key} className="block">
          <span className="text-gray-700">{field.label}</span>
          <Autocomplete
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_KEY}
            onPlaceSelected={onPlaceSelected}
            options={{
              types: ["establishment", "geocode"], // for businesses and addresses
              componentRestrictions: { country: "no" },
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </label>
      );
    } else if (field.type === "number") {
      return (
        <label key={field.key} className="block">
          <span className="text-gray-700">{field.label}</span>
          <input
            type="number"
            value={fieldValue}
            onChange={(e) =>
              handleInputChange(category, field.key, e.target.value)
            }
            className="mt-1 block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </label>
      );
    } else {
      return (
        <label key={field.key} className="block">
          <span className="text-gray-700">{field.label}</span>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) =>
              handleInputChange(category, field.key, e.target.value)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </label>
      );
    }
  };

  const renderSection = (section) => {
    // Render fields if present
    if (section.fields) {
      return section.fields.map((field) =>
        renderField(section.category, field)
      );
    }
    // Render multi-select options if present
    if (section.options) {
      return renderField(section.category, {
        key: section.category, // use the category as key
        label: section.label,
        type: "multi-select",
        options: section.options,
      });
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Opprett Lokasjon
      </button>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto"
          >
            <h2 className="text-xl font-semibold text-center">
              Opprett ny Lokasjon
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {fieldConfig.map((section) => (
                <div key={section.category} className="col-span-2">
                  <h3 className="font-semibold text-lg text-gray-700 mb-2">
                    {section.label}
                  </h3>
                  <div className={`grid grid-cols-2 gap-4`}>
                    {renderSection(section)}
                  </div>
                </div>
              ))}
            <input type="file" multiple onChange={handleImageChange} className="mt-4" />

            </div>
            <button
              type="submit"
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Lagre Lokasjon
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CreateLocationForm;
