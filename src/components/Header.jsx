import React from 'react';

export default function Header({ title, subtitle, action }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="header-actions">{action}</div>}
    </header>
  );
}
