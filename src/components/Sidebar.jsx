import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  ReceiptText,
  Library
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/books', label: 'Books', icon: BookOpen },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/issue-book', label: 'Issue Book', icon: ArrowUpRight },
    { to: '/return-book', label: 'Return Book', icon: ArrowDownLeft },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">
          <Library size={24} />
        </div>
        <div>
          <div className="sidebar-brand-title">BookNest</div>
          <div className="sidebar-brand-subtitle">LIBRARY MANAGEMENT</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? 'nav-link-item active' : 'nav-link-item'
              }
              end={item.to === '/'}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span>University Library</span>
        <span>v1.0</span>
      </div>
    </aside>
  );
}
