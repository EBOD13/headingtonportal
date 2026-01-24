import React, { useState, useEffect } from "react";
import { X, User, Mail, Phone, Home, Hash, Calendar } from "lucide-react";
import "./CreateResidentModal.css"; // optional; reuse modal styles if you want

const SEMESTER_OPTIONS = ["Spring", "Summer", "Fall"];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 8 }).map((_, idx) => currentYear + idx);

const CreateResidentModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState({
    name: "",
    roomNumber: "",
    email: "",
    phoneNumber: "",
    studentID: "",
    semester: "",
    year: "",
    active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened (optional – comment out if you want to keep values)
      setForm({
        name: "",
        roomNumber: "",
        email: "",
        phoneNumber: "",
        studentID: "",
        semester: "",
        year: "",
        active: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Full name is required";
    if (!form.roomNumber.trim()) newErrors.roomNumber = "Room number is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!form.studentID.trim()) newErrors.studentID = "Student ID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = (e) => {
  e.preventDefault();

  // Optional but recommended if you track submitting state
  if (typeof isSubmitting !== "undefined" && isSubmitting) return;

  if (!validate()) return;

  const payload = {
    name: form.name?.trim(),
    roomNumber: form.roomNumber?.trim().toUpperCase(),
    email: form.email?.trim().toLowerCase(),
    phoneNumber: form.phoneNumber?.trim(),
    studentID: form.studentID?.trim(),
    semester: form.semester || undefined,
    year: form.year ? Number(form.year) : undefined,

    active:
      typeof form.active === "boolean"
        ? form.active
        : true,
  };

  onSubmit?.(payload);
};

  return (
    <div className="modal-overlay" onClick={onClose}>
  <div
    className="modal-container create-resident-modal"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-resident-info">
            <div className="modal-avatar">
              {(form.name || "R")
                .split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="modal-title-row">
              <h2>Create Resident</h2>
            </div>
          </div>

          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {/* Content / Form */}
        <div className="modal-content">
          <form onSubmit={handleSubmit} className="create-resident-form">
            <div className="form-grid">
              {/* Name */}
              <div className="form-field">
                <label htmlFor="name">
                  <span className="label-icon">
                    <User size={14} />
                  </span>
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g., Jane Doe"
                  disabled={isSubmitting}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              {/* Room Number */}
              <div className="form-field">
                <label htmlFor="roomNumber">
                  <span className="label-icon">
                    <Home size={14} />
                  </span>
                  Room Number
                </label>
                <input
                  id="roomNumber"
                  name="roomNumber"
                  type="text"
                  value={form.roomNumber}
                  onChange={handleChange}
                  placeholder="e.g., N222 or S318"
                  disabled={isSubmitting}
                />
                {errors.roomNumber && (
                  <p className="field-error">{errors.roomNumber}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-field">
                <label htmlFor="email">
                  <span className="label-icon">
                    <Mail size={14} />
                  </span>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g., jane.doe@ou.edu"
                  disabled={isSubmitting}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="form-field">
                <label htmlFor="phoneNumber">
                  <span className="label-icon">
                    <Phone size={14} />
                  </span>
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g., 405-555-1234"
                  disabled={isSubmitting}
                />
                {errors.phoneNumber && (
                  <p className="field-error">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Student ID (stored hashed in backend) */}
              <div className="form-field">
                <label htmlFor="studentID">
                  <span className="label-icon">
                    <Hash size={14} />
                  </span>
                  Student ID
                </label>
                <input
                  id="studentID"
                  name="studentID"
                  type="text"
                  value={form.studentID}
                  onChange={handleChange}
                  placeholder="Internal student ID"
                  disabled={isSubmitting}
                />
                {errors.studentID && (
                  <p className="field-error">{errors.studentID}</p>
                )}
              </div>

              {/* Semester */}
              <div className="form-field">
                <label htmlFor="semester">
                  <span className="label-icon">
                    <Calendar size={14} />
                  </span>
                  Semester (optional)
                </label>
                <select
                  id="semester"
                  name="semester"
                  value={form.semester}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select semester</option>
                  {SEMESTER_OPTIONS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div className="form-field">
                <label htmlFor="year">
                  <span className="label-icon">
                    <Calendar size={14} />
                  </span>
                  Year (optional)
                </label>
                <select
                  id="year"
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active toggle */}
            <div className="form-field active-toggle-field">
            <div className="active-toggle-header">
                <span className="active-toggle-label">Resident status</span>
                <span
                className={`status-pill ${form.active ? "active" : "inactive"}`}
                >
                {form.active ? "Active" : "Paused"}
                </span>
            </div>

            <label htmlFor="active" className="switch">
                <input
                id="active"
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={handleChange}
                disabled={isSubmitting}
                />
                <span className="switch-track">
                <span className="switch-thumb" />
                </span>
                <span className="switch-text">
                {form.active
                    ? "Resident can receive visitors and will appear as active."
                    : "Resident is paused and will appear inactive in the roster."}
                </span>
            </label>
            </div>

                        </div>

            {/* Footer buttons */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Resident"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateResidentModal;
