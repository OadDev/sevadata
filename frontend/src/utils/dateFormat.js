// Date formatting utilities - format: "26th March, 2026"

const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  // Handle both HH:MM and HH:MM:SS formats
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = minutes || '00';
  
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  
  return `${displayHour}:${minute}${period}`;
};

export const formatDateTime = (dateString, timeString) => {
  const formattedDate = formatDate(dateString);
  const formattedTime = formatTime(timeString);
  
  if (formattedTime) {
    return `${formattedDate} at ${formattedTime}`;
  }
  return formattedDate;
};

export const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHour = hours % 12 || 12;
  
  return `${day}${getOrdinalSuffix(day)} ${month}, ${year} at ${displayHour}:${minutes}${period}`;
};
