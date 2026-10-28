import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, Users, ArrowUpRight, ArrowRight, Library } from 'lucide-react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    issuedBooks: 0,
    totalMembers: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [booksMap, setBooksMap] = useState({});
  const [membersMap, setMembersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [booksData, membersData, transactionsData] = await Promise.all([
        api.getBooks(),
        api.getMembers(),
        api.getTransactions(),
      ]);

      const books = booksData || [];
      const members = membersData || [];
      const transactions = transactionsData || [];

      // Calculate stats
      const totalBooks = books.length;
      const availableBooks = books.filter((b) => b.status === 'Available').length;
      const issuedBooks = books.filter((b) => b.status === 'Issued').length;
      const totalMembers = members.length;

      setStats({
        totalBooks,
        availableBooks,
        issuedBooks,
        totalMembers,
      });

      // Quick lookup map
      const bMap = {};
      books.forEach((b) => { bMap[b.id] = b; });
      setBooksMap(bMap);

      const mMap = {};
      members.forEach((m) => { mMap[m.id] = m; });
      setMembersMap(mMap);

      // Newest transactions first (slice last 5)
      const sorted = [...transactions].reverse().slice(0, 5);
      setRecentTransactions(sorted);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Make sure JSON Server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="BookNest Library Dashboard"
        subtitle="Live metrics, circulation summary, and recent transaction records"
        action={
          <Link to="/issue-book" className="btn btn-primary">
            <ArrowUpRight size={18} />
            Issue a Book
          </Link>
        }
      />

      <div className="content-area">
        {error && (
          <div className="alert-banner error">
            <span>{error}</span>
            <button className="btn btn-sm btn-secondary" onClick={loadDashboardData}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading real-time library statistics...</p>
          </div>
        ) : (
          <>
            {/* Live KPI Statistics Grid */}
            <div className="stats-grid">
              <StatCard
                label="Total Books"
                value={stats.totalBooks}
                hint="Catalog size in collection"
                icon={BookOpen}
                accent="magenta"
              />
              <StatCard
                label="Available Books"
                value={stats.availableBooks}
                hint="Ready for circulation"
                icon={CheckCircle}
                accent="green"
              />
              <StatCard
                label="Currently Issued"
                value={stats.issuedBooks}
                hint="On loan to members"
                icon={Clock}
                accent="amber"
              />
              <StatCard
                label="Registered Members"
                value={stats.totalMembers}
                hint="Active university borrowers"
                icon={Users}
                accent="blue"
              />
            </div>

            {/* Main Dashboard Section */}
            <div className="dashboard-grid">
              {/* Recent Transactions List */}
              <div className="card">
                <div className="section-header">
                  <h2 className="section-title">Recent Transactions</h2>
                  <Link to="/transactions" className="btn btn-sm btn-secondary">
                    View All <ArrowRight size={15} />
                  </Link>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div className="empty-icon">
                      <Library size={28} />
                    </div>
                    <div className="empty-title">No transactions recorded yet</div>
                    <p className="empty-desc">
                      Issue your first book to a registered student or faculty member.
                    </p>
                    <Link to="/issue-book" className="btn btn-primary btn-sm">
                      Issue First Book
                    </Link>
                  </div>
                ) : (
                  <div className="table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Book</th>
                          <th>Member</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTransactions.map((tx) => {
                          const book = booksMap[tx.bookId];
                          const member = membersMap[tx.memberId];
                          return (
                            <tr key={tx.id}>
                              <td style={{ fontWeight: 600 }}>
                                {book ? book.title : `Book #${tx.bookId}`}
                              </td>
                              <td style={{ color: 'var(--text-secondary)' }}>
                                {member ? member.name : `Member #${tx.memberId}`}
                              </td>
                              <td>{tx.dueDate}</td>
                              <td>
                                <StatusBadge status={tx.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Activity & Quick Action Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="card">
                  <div className="section-header">
                    <h2 className="section-title">Circulation Health</h2>
                  </div>
                  <div className="stats-summary-list">
                    <div className="summary-item">
                      <span className="summary-item-label">Circulation Rate</span>
                      <span className="summary-item-val">
                        {stats.totalBooks > 0
                          ? `${Math.round((stats.issuedBooks / stats.totalBooks) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item-label">Available Ratio</span>
                      <span className="summary-item-val">
                        {stats.totalBooks > 0
                          ? `${Math.round((stats.availableBooks / stats.totalBooks) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-item-label">Active Members</span>
                      <span className="summary-item-val">{stats.totalMembers}</span>
                    </div>
                  </div>
                </div>

                <div className="quick-action-card">
                  <div className="action-card-header">
                    <div className="action-card-title">Quick Book Return</div>
                    <p className="action-card-desc">
                      Check in a returned book to make it immediately available for other patrons.
                    </p>
                  </div>
                  <Link to="/return-book" className="btn btn-secondary" style={{ width: '100%' }}>
                    Go to Return Portal
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
