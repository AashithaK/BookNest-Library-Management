import React from 'react';

export default function StatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : 'available';

  let badgeClass = 'available';
  let label = status;

  if (normalized === 'issued') {
    badgeClass = 'issued';
    label = 'Issued';
  } else if (normalized === 'returned') {
    badgeClass = 'returned';
    label = 'Returned';
  } else {
    badgeClass = 'available';
    label = 'Available';
  }

  return (
    <span className={`status-badge ${badgeClass}`}>
      <span className="status-dot"></span>
      {label}
    </span>
  );
}
