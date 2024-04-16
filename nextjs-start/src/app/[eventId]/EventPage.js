'use client'
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function EventPage({ user, eventId }) {
  console.log('Event ID:', eventId);
  console.log('User:', user);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      const docRef = doc(db, "events", eventId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const eventData = docSnap.data();
        setEvent(eventData);
        checkAuthorization(eventData); // Moved inside here after eventData is set
      } else {
        console.log("No such document!");
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventId, user]); // Added user to the dependency array

  const checkAuthorization = (eventData) => {
    console.log('Checking authorization with eventData:', eventData);
    if (user && eventData && eventData.rbac.includes(user)) {
      setIsAuthorized(true);
    } else {
      console.log('/unauthorized');
      console.log('User:', user);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthorized) {
    return <p>Not authorized to view this event.</p>;
  }

  return (
    <div>
      <h1>{event?.name}</h1>
      <p>Date: {event?.startDate} to {event?.endDate}</p>
      {/* Other event details */}
    </div>
  );
}
