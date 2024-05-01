'use client';
import { db } from '../../../src/lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

const LocationDetails = ({params: { locationId }}) => {
  console.log(locationId);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (locationId) {
      const fetchLocation = async () => {
        const docRef = doc(db, 'locations', locationId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLocation(docSnap.data());
        } else {
          console.log('No such location!');
        }
      };

      fetchLocation();
    }
  }, [locationId]);

  if (!location) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>{location.name}</h1>
      <p>{location.description}</p>
      {/* Render additional location details */}
    </div>
  );
};

export default LocationDetails;
