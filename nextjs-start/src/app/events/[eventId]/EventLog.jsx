'use client';
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/firebase';
import { formatDistanceToNowStrict } from 'date-fns';

const EventLog = ({ eventId }) => {
  const [logs, setLogs] = useState([]);
  const [visibleLogsCount, setVisibleLogsCount] = useState(3); // Initially show 3 logs
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const eventRef = doc(db, 'events', eventId);
    const unsubscribe = onSnapshot(eventRef, async (docSnap) => {
      if (docSnap.exists()) {
        const logsData = docSnap.data().eventLogs || [];
        const logsWithUserDetails = await Promise.all(logsData.map(async (log) => {
          const userRef = doc(db, 'users', log.user);
          const userSnap = await getDoc(userRef);
          return {
            ...log,
            user: userSnap.exists() ? userSnap.data().email : "Unknown User",
            details: log.details.replace(/<[^>]*>|"/g, ''), // Remove HTML tags and quotation marks
          };
        }));

        // Sort logs by timestamp in descending order
        logsWithUserDetails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setLogs(logsWithUserDetails);
        setLoading(false);
      } else {
        console.log('No such document!');
      }
    }, (error) => {
      console.error('Error getting document:', error);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [eventId]);

  const handleShowMore = () => {
    setVisibleLogsCount(prevCount => prevCount + 5); // Load 5 more logs each time
  };

  if (loading) {
    return <div className="text-center text-gray-500"></div>;
  }

  return (
    <div className="max-w-md p-4 bg-blue-100 rounded-lg shadow-md mt-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Siste endringer</h3>
      {logs.length > 0 ? (
        <ul className="list-disc pl-5 space-y-2">
          {logs.slice(0, visibleLogsCount).map((log, index) => (
            <li key={index} className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">
                {formatDistanceToNowStrict(new Date(log.timestamp), { addSuffix: true })}:
              </span>
              <span> {log.user}</span> <span className="italic">{log.details}</span>
            </li>
          ))}
          {visibleLogsCount < logs.length && (
            <button onClick={handleShowMore} className="mt-2 text-blue-500 hover:text-blue-700">
              Show More
            </button>
          )}
        </ul>
      ) : (
        <p className="text-gray-500">No logs to display.</p>
      )}
    </div>
  );
};

export default EventLog;
