// FetchLocations.jsx
'use client';
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore"; 
import { db } from "../../lib/firebase/firebase";
import LocationCard from './LocationCard'; // import LocationCard
import SearchBar from './SearchBar'; // import the SearchBar component
import CreateLocationForm from './CreateLocationForm'; // import the CreateLocations component

const FetchLocations = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "locations"));
            const locationsList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setLocations(locationsList);
            setFilteredLocations(locationsList); // Initially, all locations are shown
        } catch (error) {
            console.error("Error fetching locations: ", error);
        }
        setLoading(false);
    };

    fetchLocations();
  }, []);

  const handleSearch = (searchTerm) => {
    const filtered = locations.filter(location =>
      location.name?.toLowerCase().includes(searchTerm.toLowerCase())
      // Implement additional search filters if needed
    );
    setFilteredLocations(filtered);
  };

  if (loading) {
    return <div className="text-center">Loading locations...</div>;
  }

  return (
    <>
    <div className="flex flex-row justify-between items-center">
        <div className="flex-grow">
            <SearchBar total={filteredLocations.length} onSearch={handleSearch} />
        </div>
        <CreateLocationForm />
    </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {filteredLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
        ))}
      </div>
    </>
  );
};

export default FetchLocations;
