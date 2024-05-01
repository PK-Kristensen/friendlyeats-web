'use client'
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase/firebase';
import {
  onSnapshot,
  addDoc,
  collection,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import EventPlan from './EventPlan';
import EventDetails from './EventDetails';
import { useEventPlan } from './EventPlanContext';


export default function EventPage({ user, eventId}) {
  console.log('EventPage user:', user);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { eventDays, setEventDays } = useEventPlan();

  const checkAuthorization = (eventData) => {
    if (user && eventData && eventData.rbac.includes(user)) {
      setIsAuthorized(true);
    } else {
      console.log('/unauthorized');
    }
  };

  useEffect(() => {
    const fetchEventAndCheckAuth = async () => {
      if (!eventId) return;
  
      // Fetch event details for authorization
      const eventRef = doc(db, 'events', eventId);
      const eventSnapshot = await getDoc(eventRef);
      if (!eventSnapshot.exists()) {
        console.log("No such document!");
        setLoading(false);
        return;
      }
  
      // Extract event data
      const eventData = eventSnapshot.data();
      eventData.id = eventSnapshot.id;
      setEvent(eventData);

      // Check authorization
      checkAuthorization(eventData);
  
      // Fetch event days and their sequences if authorized
      const eventDaysQuery = query(collection(db, 'events', eventId, 'eventDays'), orderBy('date'));
      const unsubscribeEventDays = onSnapshot(eventDaysQuery, (eventDaysSnapshot) => {
        const eventDaysUpdates = eventDaysSnapshot.docs.map((eventDayDoc) => {
          const eventDayId = eventDayDoc.id;
          const eventDayData = {
            id: eventDayId,
            ...eventDayDoc.data(),
            date: eventDayDoc.data().date?.toDate ? eventDayDoc.data().date.toDate() : new Date(eventDayDoc.data().date),
            sequences: [],
          };
  
          // Query for sequences
          const sequencesQuery = query(collection(db, 'events', eventId, 'eventDays', eventDayId, 'sequences'), orderBy('index', 'asc'));
          onSnapshot(sequencesQuery, (sequencesSnapshot) => {
            const sequences = sequencesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            eventDayData.sequences = sequences;

            // You may need to manage state update here for each event day's sequences
            setEventDays(prev => {
              const updatedEventDays = prev.map(day => {
                if (day.id === eventDayId) {
                  return eventDayData;
                }
                return day;
              });
              return updatedEventDays;
            }
            );
          });
  
          return eventDayData;
        });
  
        // Update event days state if authorized
        setEventDays(eventDaysUpdates);
        setLoading(false);
      });
  
      return () => unsubscribeEventDays(); // Clean up the subscription
    };
  
    fetchEventAndCheckAuth();
    console.log('EventPage useEffect', eventDays);
  }, [eventId, user, setEventDays]); // Added setEventDays to the dependency array if needed

  if (loading) {
    return <p>Laster...</p>;
  }

  if (!isAuthorized) {
    return <p>Feilmelding: Det kan se ut som du ikke har tilgang til dette arrangementet</p>;
  }

  return (
    <div className="flex flex-col max-w-14xl p-4 space-y-4 flex-start">
      <div className="flex-1">
        <EventDetails event={event} eventId={eventId} setEvent={setEvent} user={user} />
      </div>
      <div className="flex-1">
        <EventPlan user={user} eventId={eventId} event={event} />
      </div>
    </div>
  );
  
}
