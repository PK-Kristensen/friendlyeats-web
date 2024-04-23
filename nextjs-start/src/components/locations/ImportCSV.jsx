'use client';
import React, { useState } from 'react';
import Papa from 'papaparse';
import { collection, addDoc } from 'firebase/firestore'; 
import { db } from '../../lib/firebase/firebase';

const ImportCsvToFirebase = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          for (const row of results.data) {
            const locationData = {
              name: row.Name,
              price: row.Price === 'Price not listed' ? null : row.Price,
              seating: parseInt(row.Seating, 10) || null,
              imageUrl: row['Image URL'],
              additionalOptions: row['Additional Options'].split('·').filter(Boolean),
              // ...other fields as needed
            };
  
            try {
              const docRef = await addDoc(collection(db, "locations"), locationData);
              console.log("Document written with ID: ", docRef.id);
            } catch (error) {
              console.error("Error adding document: ", error);
            }
          }
        },
      });
    }
  };
  

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept=".csv" />
      <button onClick={handleUpload}>Upload to Firebase</button>
    </div>
  );
};

export default ImportCsvToFirebase;
