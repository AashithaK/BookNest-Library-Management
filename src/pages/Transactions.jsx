import React, { useState, useEffect } from 'react';
import { ReceiptText, CheckCircle2, Clock, X } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import { api } from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [booksMap, setBooksMap] = useState({});
  const [membersMap, setMembersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [txData, booksData, membersData] = await Promise.all([
        api.getTransactions(),
        api.getBooks(),
        api.getMembers(),
      ]);

      const bMap = {};
      (booksData || []).forEach((b) => {
        bMap[b.id] = b;
      });
      setBooksMap(bMap);

      const mMap = {};
      (membersData || []).forEach((m) => {
        mMap[m.id] = m;
      });
      setMembersMap(mMap);

      // Display newest transactions first
      const sorted = [...(txData || [])].reverse();
      setTransactions(sorted);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const bookTitle = (booksMap[tx.bookId]?.title || '').toLowerCase();
    const memberName = (membersMap[tx.memberId]?.name || '').toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      bookTitle.includes(q) ||
      memberName.includes(q) ||
      String(tx.id).includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <Header
        title="Circulation Logs & Transactions"
        subtitle="Complete audit history of book lending, due schedules, and returns"
      />

      <div className="content-area">
        {errorMsg && (
          <div className="alert-banner error">
            <span>{errorMsg}</span>
            <button className="btn-icon" onClick={() => setErrorMsg('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="filter-bar">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search logs by book title, patron name, or ID..."
          />

          <div className="filter-controls">
            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Issued">Issued (Active Loans)</option>
              <option value="Returned">Returned (Completed)</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading transaction history records...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <ReceiptText size={28} />
            </div>
            <div className="empty-title">
              {transactions.length === 0
                ? 'No transaction history found'
                : 'No matching transaction records'}
            </div>
            <p className="empty-desc">
              {transactions.length === 0
                ? 'When books are issued and returned, permanent ledger records will be displayed here.'
                : 'Try adjusting your search query or status filter.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher #</th>
                  <th>Book Title</th>
                  <th>Patron</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const book = booksMap[tx.bookId];
                  const member = membersMap[tx.memberId];

                  return (
                    <tr key={tx.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          #{tx.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {book ? book.title : `Book ID #${tx.bookId}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {book ? `Author: ${book.author}` : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {member ? member.name : `Member ID #${tx.memberId}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {member ? member.email : ''}
                        </div>
                      </td>
                      <td>{tx.issueDate}</td>
                      <td>{tx.dueDate}</td>
                      <td>
                        {tx.returnDate ? (
                          <span style={{ color: 'var(--status-avail-text)', fontWeight: 500 }}>
                            {tx.returnDate}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Not returned yet
                          </span>
                        )}
                      </td>
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
    </div>
  );
}
