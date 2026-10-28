import React from 'react';

export default function StatCard({ label, value, hint, icon: Icon, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {hint && <span className="stat-hint">{hint}</span>}
      </div>
      {Icon && (
        <div className={`stat-icon-wrapper ${accent || ''}`.trim()}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
