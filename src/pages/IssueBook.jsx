import React, { useState, useEffect } from 'react';
import { ArrowUpRight, CheckCircle2, AlertTriangle, Book, User, Calendar, X } from 'lucide-react';
import Header from '../components/Header';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function IssueBook() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const today = new Date().toISOString().split('T')[0];
  const nextTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(nextTwoWeeks);

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [booksData, membersData] = await Promise.all([
        api.getBooks(),
        api.getMembers(),
      ]);
      setBooks(booksData || []);
      setMembers(membersData || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load library catalog and member list.');
    } finally {
      setLoading(false);
    }
  };

  // Only Available books can be issued
  const availableBooks = books.filter((b) => b.status === 'Available');

  // Currently selected objects
  const selectedBook = books.find((b) => String(b.id) === String(selectedBookId));
  const selectedMember = members.find((m) => String(m.id) === String(selectedMemberId));

  const validate = () => {
    const errors = {};
    if (!selectedMemberId) errors.member = 'Please select a registered library member';
    if (!selectedBookId) errors.book = 'Please select an available book to issue';

    if (!issueDate) errors.issueDate = 'Issue date is required';
    if (!dueDate) errors.dueDate = 'Due date is required';

    if (issueDate && dueDate && dueDate < issueDate) {
      errors.dueDate = 'Due date cannot be earlier than issue date';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePreSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleExecuteIssue = async () => {
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Double check book status from backend directly to prevent race conditions
      const currentBook = await api.getBookById(selectedBookId);
      if (!currentBook) {
        throw new Error('The selected book could not be found.');
      }
      if (currentBook.status === 'Issued') {
        throw new Error(
          `"${currentBook.title}" was already issued to another patron. Please select another book.`
        );
      }

      // 2. Validate member existence
      const currentMember = await api.getMemberById(selectedMemberId);
      if (!currentMember) {
        throw new Error('The selected member account does not exist.');
      }

      // 3. Create Transaction record in JSON Server
      const newTransaction = {
        bookId: String(selectedBookId),
        memberId: String(selectedMemberId),
        issueDate: issueDate,
        dueDate: dueDate,
        returnDate: null,
        status: 'Issued',
      };

      await api.addTransaction(newTransaction);

      // 4. Update book status to 'Issued'
      const updatedBook = {
        ...currentBook,
        status: 'Issued',
      };
      await api.updateBook(selectedBookId, updatedBook);

      // 5. Success state and reset
      setSuccessMsg(
        `Successfully issued "${currentBook.title}" to ${currentMember.name}. Due on ${dueDate}.`
      );
      setShowConfirm(false);
      setSelectedBookId('');
      setSelectedMemberId('');
      setIssueDate(today);
      setDueDate(nextTwoWeeks);
      setFormErrors({});

      // Reload fresh data
      await loadData();
    } catch (err) {
      setShowConfirm(false);
      setErrorMsg(err.message || 'Circulation transaction failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header
        title="Book Circulation: Issue Desk"
        subtitle="Authorize book checkout and assign loan periods to registered university patrons"
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

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading circulation inventory and patrons...</p>
          </div>
        ) : (
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div className="card">
              <form onSubmit={handlePreSubmit}>
                <div style={{ marginBottom: '1.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Book Allocation Form
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Select an eligible member and an available book to record the circulation voucher.
                  </p>
                </div>

                {/* Form Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  {/* Select Member */}
                  <div className="form-group">
                    <label className="form-label">
                      Select Member <span className="required">*</span>
                    </label>
                    <select
                      className={`form-control ${formErrors.member ? 'error' : ''}`}
                      value={selectedMemberId}
                      onChange={(e) => {
                        setSelectedMemberId(e.target.value);
                        if (formErrors.member) setFormErrors({ ...formErrors, member: null });
                      }}
                    >
                      <option value="">-- Choose Registered Member --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                    {formErrors.member && <div className="form-error">{formErrors.member}</div>}
                  </div>

                  {/* Select Book */}
                  <div className="form-group">
                    <label className="form-label">
                      Select Available Book <span className="required">*</span>
                    </label>
                    <select
                      className={`form-control ${formErrors.book ? 'error' : ''}`}
                      value={selectedBookId}
                      onChange={(e) => {
                        setSelectedBookId(e.target.value);
                        if (formErrors.book) setFormErrors({ ...formErrors, book: null });
                      }}
                    >
                      <option value="">-- Choose Available Volume --</option>
                      {availableBooks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} (ISBN: {b.isbn})
                        </option>
                      ))}
                    </select>
                    {formErrors.book && <div className="form-error">{formErrors.book}</div>}
                    {availableBooks.length === 0 && (
                      <div className="form-error" style={{ color: 'var(--status-issued-text)' }}>
                        All catalog books are currently on loan.
                      </div>
                    )}
                  </div>

                  {/* Issue Date */}
                  <div className="form-group">
                    <label className="form-label">
                      Issue Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.issueDate ? 'error' : ''}`}
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                    {formErrors.issueDate && (
                      <div className="form-error">{formErrors.issueDate}</div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="form-group">
                    <label className="form-label">
                      Due Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.dueDate ? 'error' : ''}`}
                      value={dueDate}
                      min={issueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    {formErrors.dueDate && <div className="form-error">{formErrors.dueDate}</div>}
                  </div>
                </div>

                {/* Useful Info / Live Preview */}
                {(selectedBook || selectedMember) && (
                  <div className="detail-preview-grid" style={{ marginTop: '0.75rem' }}>
                    <div className="detail-card">
                      <div className="detail-card-title">
                        <Book size={16} /> Selected Book
                      </div>
                      {selectedBook ? (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">Title</span>
                            <span className="detail-value">{selectedBook.title}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Author</span>
                            <span className="detail-value">{selectedBook.author}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">ISBN</span>
                            <span className="detail-value">{selectedBook.isbn}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Category</span>
                            <span className="detail-value">{selectedBook.category}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No book selected yet.
                        </div>
                      )}
                    </div>

                    <div className="detail-card">
                      <div className="detail-card-title">
                        <User size={16} /> Selected Patron
                      </div>
                      {selectedMember ? (
                        <>
                          <div className="detail-row">
                            <span className="detail-label">Name</span>
                            <span className="detail-value">{selectedMember.name}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{selectedMember.email}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{selectedMember.phone}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Member Since</span>
                            <span className="detail-value">{selectedMember.membershipDate}</span>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          No patron selected yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedBookId('');
                      setSelectedMemberId('');
                      setFormErrors({});
                    }}
                  >
                    Clear Selections
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={availableBooks.length === 0}
                  >
                    <ArrowUpRight size={18} />
                    Issue Book Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmDialog
          isOpen={showConfirm}
          title="Confirm Book Circulation"
          message={`Are you sure you want to issue "${selectedBook?.title}" to member "${selectedMember?.name}"? The due return date will be set to ${dueDate}.`}
          confirmLabel="Authorize Issue"
          loading={submitting}
          onConfirm={handleExecuteIssue}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </div>
  );
}
