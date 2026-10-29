import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Users, X, Mail, Phone, Calendar } from 'lucide-react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ConfirmDialog from '../components/ConfirmDialog';
import { api } from '../services/api';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    membershipDate: new Date().toISOString().split('T')[0],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    member: null,
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
      const [membersData, txData] = await Promise.all([
        api.getMembers(),
        api.getTransactions(),
      ]);
      setMembers(membersData || []);
      setTransactions(txData || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch members.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      membershipDate: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone,
      membershipDate: member.membershipDate || new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email format (e.g. user@univ.edu)';
    } else {
      // Check duplicate email
      const duplicate = members.find(
        (m) =>
          m.email.trim().toLowerCase() === formData.email.trim().toLowerCase() &&
          (!editingMember || String(m.id) !== String(editingMember.id))
      );
      if (duplicate) {
        errors.email = `A member with email "${duplicate.email}" already exists`;
      }
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number (at least 7 digits)';
    }

    if (!formData.membershipDate) {
      errors.membershipDate = 'Membership date is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingMember) {
        // PUT /members/:id
        const updated = {
          ...editingMember,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          membershipDate: formData.membershipDate,
        };
        await api.updateMember(editingMember.id, updated);
        showNotification(`Member "${updated.name}" updated successfully.`);
      } else {
        // POST /members
        const newMember = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          membershipDate: formData.membershipDate,
        };
        await api.addMember(newMember);
        showNotification(`New member "${newMember.name}" enrolled successfully.`);
      }
      closeModal();
      await loadData();
    } catch (err) {
      showNotification(err.message || 'Error processing member record.', true);
    } finally {
      setSubmitting(false);
    }
  };

  // Rule: Prevent deleting member with currently issued books
  const hasActiveBooks = (memberId) => {
    return transactions.some(
      (tx) => String(tx.memberId) === String(memberId) && tx.status === 'Issued'
    );
  };

  const handleDeleteClick = (member) => {
    if (hasActiveBooks(member.id)) {
      showNotification(
        `Cannot delete member "${member.name}" because they have unreturned books on issue. All books must be returned prior to membership termination.`,
        true
      );
      return;
    }

    setDeleteDialog({
      isOpen: true,
      member,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.member) return;
    try {
      await api.deleteMember(deleteDialog.member.id);
      showNotification(`Member record for "${deleteDialog.member.name}" deleted.`);
      setDeleteDialog({ isOpen: false, member: null });
      await loadData();
    } catch (err) {
      showNotification(err.message || 'Failed to remove member record.', true);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <Header
        title="Member Registry & Accounts"
        subtitle="Maintain university student, faculty, and research scholar library memberships"
        action={
          <button className="btn btn-primary" onClick={openAddModal}>
            <UserPlus size={18} />
            Add Member
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

        {/* Search Bar */}
        <div className="filter-bar">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search members by name, email, or contact number..."
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading university membership records...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Users size={28} />
            </div>
            <div className="empty-title">
              {members.length === 0 ? 'No members registered' : 'No matching members found'}
            </div>
            <p className="empty-desc">
              {members.length === 0
                ? 'Register your first library patron to enable circulation.'
                : 'Try adjusting your search query.'}
            </p>
            {members.length === 0 ? (
              <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                Enroll Member
              </button>
            ) : (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Joined Date</th>
                  <th>Active Loans</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const activeCount = transactions.filter(
                    (tx) => String(tx.memberId) === String(member.id) && tx.status === 'Issued'
                  ).length;

                  return (
                    <tr key={member.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          ID: #{member.id}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Mail size={14} color="var(--text-muted)" />
                          <span>{member.email}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Phone size={14} color="var(--text-muted)" />
                          <span>{member.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={14} color="var(--text-muted)" />
                          <span>{member.membershipDate}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '999px',
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            backgroundColor: activeCount > 0 ? 'var(--status-issued-bg)' : 'var(--bg-secondary)',
                            color: activeCount > 0 ? 'var(--status-issued-text)' : 'var(--text-secondary)',
                            border: `1px solid ${activeCount > 0 ? 'var(--status-issued-border)' : 'var(--border-subtle)'}`,
                          }}
                        >
                          {activeCount} {activeCount === 1 ? 'book' : 'books'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn-icon"
                            title="Edit Member"
                            onClick={() => openEditModal(member)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon delete"
                            title={
                              activeCount > 0
                                ? 'Cannot delete member with active loans'
                                : 'Delete Member'
                            }
                            onClick={() => handleDeleteClick(member)}
                          >
                            <Trash2 size={16} />
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

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingMember ? 'Edit Member Profile' : 'Enroll New Member'}
                </h3>
                <button className="btn-icon" onClick={closeModal}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.name ? 'error' : ''}`}
                      placeholder="e.g. Aashish Kumar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Email Address <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className={`form-control ${formErrors.email ? 'error' : ''}`}
                      placeholder="e.g. aashish@university.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <div className="form-error">{formErrors.email}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.phone ? 'error' : ''}`}
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                       maxLength={10}
                       inputMode="numeric"
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Membership Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${formErrors.membershipDate ? 'error' : ''}`}
                      value={formData.membershipDate}
                      onChange={(e) =>
                        setFormData({ ...formData, membershipDate: e.target.value })
                      }
                    />
                    {formErrors.membershipDate && (
                      <div className="form-error">{formErrors.membershipDate}</div>
                    )}
                  </div>
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
                    {submitting ? 'Saving...' : editingMember ? 'Update Profile' : 'Enroll Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Delete Member"
          message={`Are you sure you want to remove patron record "${deleteDialog.member?.name}" (${deleteDialog.member?.email})? This action will permanently delete this membership.`}
          confirmLabel="Delete Member"
          isDanger={true}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteDialog({ isOpen: false, member: null })}
        />
      </div>
    </div>
  );
}
