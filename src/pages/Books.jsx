import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, BookOpen, AlertCircle, X, Check } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function Books() {
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Notification banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    status: 'Available',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    book: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4500);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [booksData, txData] = await Promise.all([
        api.getBooks(),
        api.getTransactions(),
      ]);
      setBooks(booksData || []);
      setTransactions(txData || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch book records.');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(
    new Set(books.map((b) => b.category).filter(Boolean))
  );

  const openAddModal = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: '',
      status: 'Available',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      status: book.status || 'Available',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.author.trim()) errors.author = 'Author name is required';
    if (!formData.isbn.trim()) {
      errors.isbn = 'ISBN is required';
    } else {
      // Check duplicate ISBN (excluding current book if editing)
      const duplicate = books.find(
        (b) =>
          b.isbn.trim().toLowerCase() === formData.isbn.trim().toLowerCase() &&
          (!editingBook || String(b.id) !== String(editingBook.id))
      );
      if (duplicate) {
        errors.isbn = `ISBN already exists for "${duplicate.title}"`;
      }
    }
    if (!formData.category.trim()) errors.category = 'Category is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingBook) {
        // PUT /books/:id
        const updatedBook = {
          ...editingBook,
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim(),
          category: formData.category.trim(),
          status: formData.status,
        };
        await api.updateBook(editingBook.id, updatedBook);
        showNotification(`"${updatedBook.title}" updated successfully!`);
      } else {
        // POST /books
        const newBook = {
          title: formData.title.trim(),
          author: formData.author.trim(),
          isbn: formData.isbn.trim(),
          category: formData.category.trim(),
          status: 'Available',
        };
        await api.addBook(newBook);
        showNotification(`New book "${newBook.title}" added to catalog.`);
      }
      closeModal();
      await loadData();
    } catch (err) {
      showNotification(err.message || 'Error saving book details', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Check if book has active issue
  const hasActiveIssue = (bookId) => {
    return transactions.some(
      (tx) => String(tx.bookId) === String(bookId) && tx.status === 'Issued'
    );
  };

  const handleDeleteClick = (book) => {
    if (book.status === 'Issued' || hasActiveIssue(book.id)) {
      showNotification(
        `Cannot delete "${book.title}" because it is currently issued to a member. Return the book first.`,
        true
      );
      return;
    }
    setDeleteDialog({
      isOpen: true,
      book,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.book) return;
    try {
      await api.deleteBook(deleteDialog.book.id);
      showNotification(`"${deleteDialog.book.title}" has been deleted from the catalog.`);
      setDeleteDialog({ isOpen: false, book: null });
      await loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to delete book.', true);
    }
  };

  // Filtered books
  const filteredBooks = books.filter((b) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q);

    const matchCategory =
      categoryFilter === 'ALL' || b.category === categoryFilter;

    const matchStatus =
      statusFilter === 'ALL' || b.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div>
      <Header
        title="Books Catalog & Management"
        subtitle="Manage repository acquisitions, classifications, and circulation statuses"
        action={
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Add New Book
          </button>
        }
      />

      <div className="content-area">
        {successMsg && (
          <div className="alert-banner success">
            <span>{successMsg}</span>
            <button className="btn-icon" onClick={() => setSuccessMsg('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner error">
            <span>{errorMsg}</span>
            <button className="btn-icon" onClick={() => setErrorMsg('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="filter-bar">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search books by title, author, or ISBN..."
          />

          <div className="filter-controls">
            <select
              className="select-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="select-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Issued">Issued</option>
            </select>
          </div>
        </div>

        {/* Books Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Fetching book catalog from server...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <BookOpen size={28} />
            </div>
            <div className="empty-title">
              {books.length === 0 ? 'No books in repository' : 'No matching books found'}
            </div>
            <p className="empty-desc">
              {books.length === 0
                ? 'Begin building your library catalog by adding the first volume.'
                : 'Try adjusting your search criteria or clearing active filters.'}
            </p>
            {books.length === 0 ? (
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                Add Book
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('ALL');
                  setStatusFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title & Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        by {book.author}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {book.isbn}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.825rem',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {book.category}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={book.status} />
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          title="Edit Book"
                          onClick={() => openEditModal(book)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon delete"
                          title={
                            book.status === 'Issued'
                              ? 'Cannot delete an issued book'
                              : 'Delete Book'
                          }
                          onClick={() => handleDeleteClick(book)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingBook ? 'Edit Book Details' : 'Add New Book'}
                </h3>
                <button className="btn-icon" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.title ? 'error' : ''}`}
                      placeholder="e.g. Design Patterns: Elements of Reusable Object-Oriented Software"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                    {formErrors.title && <div className="form-error">{formErrors.title}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Author <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.author ? 'error' : ''}`}
                      placeholder="e.g. Erich Gamma, Richard Helm"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />
                    {formErrors.author && <div className="form-error">{formErrors.author}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      ISBN <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.isbn ? 'error' : ''}`}
                      placeholder="e.g. 9780201633610"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    />
                    {formErrors.isbn && <div className="form-error">{formErrors.isbn}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Category <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.category ? 'error' : ''}`}
                      placeholder="e.g. Computer Science, Literature, Engineering"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    {formErrors.category && <div className="form-error">{formErrors.category}</div>}
                  </div>

                  {editingBook && (
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Available">Available</option>
                        <option value="Issued">Issued</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editingBook ? 'Save Changes' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Book"
          message={`Are you sure you want to permanently remove "${deleteDialog.book?.title}" (ISBN: ${deleteDialog.book?.isbn}) from the library records? This action cannot be undone.`}
          confirmLabel="Delete Book"
          isDanger={true}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialog({ isOpen: false, book: null })}
        />
      </div>
    </div>
  );
}
