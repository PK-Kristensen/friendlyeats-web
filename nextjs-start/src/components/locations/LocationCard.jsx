'use client';
// LocationCard.js
import React, { useState } from 'react';
import Link from 'next/link';

const LocationCard = ({ location }) => {
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const xPosition = (e.clientX - left) / width - 0.5;
    const yPosition = (e.clientY - top) / height - 0.5;
    const tiltX = yPosition * 10;
    const tiltY = xPosition * 10;
    setTiltStyle({
      transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({});
  };

  return (
    <Link href={`/locations/${location.id}`} passHref>

    <div
      className="bg-white rounded-lg overflow-hidden shadow transition duration-150 ease-in-out transform hover:shadow-md hover:-translate-y-1"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
    >
      {location.imageUrl && (
        <img
          src={location.imageUrl}
          alt={location.name}
          className="w-full h-56 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">{location.name?.split('-')[0]}</h3>
        <p className="text-gray-600 text-sm mt-1">Pris: {location.price || "Send forespørsel"}</p>
        {/*
        <div className="mt-2">
          <p><strong>Facilities:</strong></p>
          <ul className="list-disc pl-5 text-sm">
            {location.additionalOptions?.map((facility, index) => (
                <li key={index}>{facility}</li>
            ))}
          </ul>
        </div>
        */}
      </div>
    </div>
    </Link>
  );
  
};

export default LocationCard;
