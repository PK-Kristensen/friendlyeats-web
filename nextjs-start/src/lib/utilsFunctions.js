export const calculateEndTime = (startTime, duration) => {
  let [hours, minutes] = startTime.split(':').map(Number);
  duration = Number(duration);
  minutes += duration
  hours += Math.floor(minutes / 60); // Convert overflow minutes into hours
  minutes %= 60; // Get the remaining minutes after converting to hours
  hours %= 24; // Correctly handle the rollover of hours

  const endTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return endTime

};

export function calculateDuration(startTime, endTime) {
  const start = new Date(`01/01/2000 ${startTime}`);
  const end = new Date(`01/01/2000 ${endTime}`);

  let durationMinutes = (end - start) / (1000 * 60);

  if (durationMinutes < 0) {
    // Add 24 hours worth of minutes if end time is past midnight
    durationMinutes += 24 * 60;
  }

  return durationMinutes;
}

export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};