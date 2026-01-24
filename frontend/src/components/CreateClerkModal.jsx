// frontend/src/components/CreateClerkModal.jsx
import React, { useEffect, useState } from "react";
import "./CreateClerkModal.css";
import { X, UserPlus, Mail } from "lucide-react";

const CreateClerkModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    if (isOpen) {
      // reset whenever we open
      setFormData({ name: "", email: "" });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container create-clerk-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-resident-info">
            <div className="modal-avatar">
              {formData.name
                ? formData.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "CL"}
            </div>
            <div className="modal-title-row">
              <h2>Create Clerk Account</h2>
              <p className="modal-subtitle">
                Invite a clerk with name and email. They’ll receive an email to
                complete setup.
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <section className="modal-section">
            <h3>Clerk details</h3>
            <form className="create-clerk-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label htmlFor="name">
                  <span className="form-label-icon">
                    <UserPlus size={16} />
                  </span>
                  <span>Full Name</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="form-row">
                <label htmlFor="email">
                  <span className="form-label-icon">
                    <Mail size={16} />
                  </span>
                  <span>Email</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="jane.doe@example.com"
                />
              </div>
            </form>
          </section>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating…" : "Create Clerk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateClerkModal;
