// TagManager.js
import React, { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useEventPlan } from './EventPlanContext';
import { writeBatch } from 'firebase/firestore';


const TagManager = ({projectId}) => {
  const { eventDays } = useEventPlan();
  const [tagsWithColor, setTagsWithColor] = useState({}); // Format: { [tagName]: color }

  useEffect(() => {
    const allTags = new Set();
    const tagColors = {};

    eventDays.forEach(eventDay => {
      eventDay.sequences.forEach(sequence => {
        sequence.tags?.forEach(tag => {
          allTags.add(tag);
          // Check if this tag's color is already recorded
          if (!tagColors[tag] && sequence.tagsColorMap?.[tag]) {
            tagColors[tag] = sequence.tagsColorMap[tag];
          }
        });
      });
    });

    // Initialize tag colors with fetched colors or default to white
    allTags.forEach(tag => {
      if (!tagsWithColor[tag]) {
        setTagsWithColor(prev => ({ ...prev, [tag]: tagColors[tag] || '#FFFFFF' }));
      }
    });
  }, [eventDays, tagsWithColor]);

  const handleColorChange = (tag, newColor) => {
    // Update tag color in state
    setTagsWithColor(prev => ({ ...prev, [tag]: newColor }));
  };

  const handleColorBlur = async (tag) => {
    // Update tag color in Firestore
    const newColor = tagsWithColor[tag];
    const batch = writeBatch(db);

    eventDays.forEach(eventDay => {
      eventDay.sequences.forEach(sequence => {
        if (sequence.tags?.includes(tag)) {
          const sequenceRef = doc(db, 'projects', projectId, 'eventDays', eventDay.id, 'sequences', sequence.id);
          const newTagsColorMap = { ...sequence.tagsColorMap, [tag]: newColor };
          batch.update(sequenceRef, { tagsColorMap: newTagsColorMap });
        }
      });
    });
    try {
        await batch.commit();
      } catch (error) {
        console.error('Error updating tag colors:', error);
      }
    };

  return (
<div className="sm:p-4 bg-white rounded-lg shadow mb-2">
  <h2 className="text-lg font-semibold text-gray-800">Tags:</h2>
  <div className="mt-4 flex flex-wrap">
    {Object.entries(tagsWithColor).map(([tag, color]) => (
      <div key={tag} className="mr-4 mb-4 flex items-center">
        <span className="mr-2 text-sm font-medium text-gray-700">{tag}:</span>
        <input
          type="color"
          value={color}
          onChange={(e) => handleColorChange(tag, e.target.value)}
          onBlur={() => handleColorBlur(tag)}
          className="w-6 h-6 border-1 border-gray-100 cursor-pointer focus:ring focus:ring-indigo-200"
        />
      </div>
    ))}
  </div>
</div>

  );
};

export default TagManager;
