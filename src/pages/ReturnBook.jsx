import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, CheckCircle2, AlertTriangle, X, RotateCcw } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function ReturnBook() {
  const [transactions, setTransactions] = useState([]);
  const [booksMap, setBooksMap] = useState({});
  const [membersMap, setMembersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Notification banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Return Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    transaction: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCirculationData();
  }, []);

  const loadCirculationData = async () => {
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

      // Only transactions that are currently Issued
      const issuedOnly = (txData || []).filter((tx) => tx.status === 'Issued');
      setTransactions(issuedOnly);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch issued books.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnClick = (tx) => {
    setConfirmDialog({
      isOpen: true,
      transaction: tx,
    });
  };

  const executeReturn = async () => {
    const tx = confirmDialog.transaction;
    if (!tx) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Verify transaction is still issued directly from backend
      const currentTx = await api.getTransactionById(tx.id);
      if (!currentTx || currentTx.status !== 'Issued') {
        throw new Error('This transaction is no longer marked as Issued or has already been returned.');
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // 1. Update the existing transaction using PUT /transactions/:id
      const updatedTx = {
        ...currentTx,
        status: 'Returned',
        returnDate: todayStr,
      };
      await api.updateTransaction(tx.id, updatedTx);

      // 2. Update the corresponding book using PUT /books/:id to make it 'Available'
      const book = await api.getBookById(tx.bookId);
      if (book) {
        const updatedBook = {
          ...book,
          status: 'Available',
        };
        await api.updateBook(book.id, updatedBook);
      }

      const bookTitle = booksMap[tx.bookId]?.title || `Book #${tx.bookId}`;
      const memberName = membersMap[tx.memberId]?.name || `Member #${tx.memberId}`;
      setSuccessMsg(`"${bookTitle}" returned successfully by ${memberName}. The book is now Available.`);

      setConfirmDialog({ isOpen: false, transaction: null });
      await loadCirculationData();
    } catch (err) {
      setErrorMsg(err.message || 'Return operation failed. Please check connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const bookTitle = (booksMap[tx.bookId]?.title || '').toLowerCase();
    const memberName = (membersMap[tx.memberId]?.name || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return bookTitle.includes(q) || memberName.includes(q) || String(tx.id).includes(q);
  });

  return (
    <div>
      <Header
        title="Book Circulation: Return Desk"
        subtitle="Process return of borrowed books and restock them into available circulation"
      />

      <div className="content-area">
        {successMsg && (
          <div className="alert-banner success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
            <button className="btn-icon" onClick={() => setSuccessMsg('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner error">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
            <button className="btn-icon" onClick={() => setErrorMsg('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="filter-bar">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search active loans by book title or patron name..."
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading active book loans...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckCircle2 size={28} color="var(--status-avail-text)" />
            </div>
            <div className="empty-title">
              {transactions.length === 0
                ? 'No books currently on loan'
                : 'No matching issued books'}
            </div>
            <p className="empty-desc">
              {transactions.length === 0
                ? 'All university catalog items are securely in repository or no active borrowings exist.'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Voucher ID</th>
                  <th>Book Title</th>
                  <th>Borrowing Member</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const book = booksMap[tx.bookId];
                  const member = membersMap[tx.memberId];
                  const isOverdue = new Date(tx.dueDate) < new Date(new Date().toDateString());

                  return (
                    <tr key={tx.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          #{tx.id}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {book ? book.title : `Book ID #${tx.bookId}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ISBN: {book ? book.isbn : 'N/A'}
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
                      <td>
                        <span
                          style={{
                            fontWeight: isOverdue ? 700 : 500,
                            color: isOverdue ? 'var(--status-error-text)' : 'inherit',
                          }}
                        >
                          {tx.dueDate} {isOverdue && '(Overdue)'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReturnClick(tx)}
                          >
                            <RotateCcw size={15} />
                            Check In Book
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Confirm Book Return"
          message={`Are you sure you want to process the return of "${booksMap[confirmDialog.transaction?.bookId]?.title || 'Selected book'}" from ${membersMap[confirmDialog.transaction?.memberId]?.name || 'patron'}? This will mark the transaction as Returned and make the book Available immediately.`}
          confirmLabel="Confirm Return"
          loading={submitting}
          onConfirm={executeReturn}
          onCancel={() => setConfirmDialog({ isOpen: false, transaction: null })}
        />
      </div>
    </div>
  );
}
