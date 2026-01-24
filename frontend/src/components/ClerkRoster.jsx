// frontend/src/components/ClerkRoster.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  fetchResidentRoster,
  setSelectedResidentLocal,
} from "../features/admin/adminSlice";
import useAdminClerks from "../hooks/useAdminClerks";
import ResidentDetailModal from "../components/ResidentDetailModal";
import { useIsAdmin } from "../hooks/useIsAdmin";
import "./ClerkRoster.css";

// lucide-react icons
import {
  Shield,
  UserCog,
  UserX,
  UserCheck,
  UserPlus,
  Users,
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  Trash2,
  Mail,
  Settings,
  Activity,
  ChevronDown,
  X,
} from "lucide-react";

// ============================================================================
// Helper components
// ============================================================================

const StatusPill = ({ active }) => (
  <span className={`status-pill ${active ? "active" : "inactive"}`}>
    <span className="dot" />
    {active ? "Active" : "Deactivated"}
  </span>
);

const ClerkCard = ({ clerk, onClick, onToggleActive, onDelete }) => (
  <div className="clerk-card" onClick={onClick}>
    <div className="clerk-card-header">
      <div className="clerk-avatar">
        {(clerk.name || "?")
          .split(" ")
          .map((p) => p[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)}
      </div>
      <div className="clerk-main">
        <h3 className="clerk-name">{clerk.name}</h3>
        <p className="clerk-email">{clerk.email}</p>
      </div>
      <StatusPill active={clerk.isActive} />
    </div>

    <div className="clerk-card-body">
      <div className="clerk-meta">
        <span className="meta-item">
          <UserCog size={14} />
          {clerk.role || "Clerk"}
        </span>
        {clerk.lastLogin && (
          <span className="meta-item">
            <Activity size={14} />
            Last login:{" "}
            {new Date(clerk.lastLogin).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>

    <div
      className="clerk-card-footer"
      onClick={(e) => {
        e.stopPropagation(); // prevent opening modal when pressing footer buttons
      }}
    >
      <button
        type="button"
        className="btn-ghost small"
        onClick={() => onToggleActive(clerk)}
      >
        {clerk.isActive ? (
          <>
            <UserX size={14} />
            Pause
          </>
        ) : (
          <>
            <UserCheck size={14} />
            Reactivate
          </>
        )}
      </button>
      <button
        type="button"
        className="btn-danger ghost small"
        onClick={() => onDelete(clerk)}
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  </div>
);

// Very lightweight clerk detail modal (you can beautify like ResidentDetailModal)
const ClerkDetailModal = ({
  clerk,
  onClose,
  onToggleActive,
  onResendInvite,
  onDelete,
  activity = [],
}) => {
  if (!clerk) return null;

  // Check if clerk needs to set password (invitation pending)
  const isPendingSetup = clerk.needsPasswordReset || clerk.passwordResetToken;
  const isExpired = clerk.passwordResetExpires && new Date(clerk.passwordResetExpires) < new Date();

  const initials = (clerk.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedActivity = activity.slice(0, 5); // show top 5 for now

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container clerk-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-resident-info">
            <div className="modal-avatar">{initials}</div>
            <div className="modal-title-row">
              <h2>{clerk.name}</h2>
              <div className="clerk-modal-sub">
                <StatusPill active={clerk.isActive} />
                <span className="role-pill">
                  <Shield size={14} />
                  {clerk.role || "Clerk"}
                </span>
                {isPendingSetup && (
                  <span className={`status-pill ${isExpired ? 'expired' : 'pending'}`}>
                    {isExpired ? '⚠️ Invite Expired' : '⏳ Pending Setup'}
                  </span>
                )}
              </div>
              <div className="clerk-contact-row">
                <span>{clerk.email}</span>
                {clerk.phone && <span>• {clerk.phone}</span>}
              </div>
              {isPendingSetup && clerk.passwordResetExpires && (
                <div className="clerk-expiry-info">
                  <small>
                    {isExpired
                      ? `Invitation expired on ${new Date(clerk.passwordResetExpires).toLocaleDateString()}`
                      : `Invitation expires: ${new Date(clerk.passwordResetExpires).toLocaleDateString()}`
                    }
                  </small>
                </div>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Quick actions */}
          <section className="modal-section">
            <h3>Account Controls</h3>
            <div className="btn-row">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onToggleActive(clerk)}
              >
                {clerk.isActive ? (
                  <>
                    <UserX size={16} />
                    Pause Access
                  </>
                ) : (
                  <>
                    <UserCheck size={16} />
                    Reactivate
                  </>
                )}
              </button>

              {/* Resend Invite Button - only show if pending setup */}
              {isPendingSetup && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onResendInvite(clerk)}
                >
                  <Mail size={16} />
                  {isExpired ? 'Resend Expired Invite' : 'Resend Invitation'}
                </button>
              )}

              <button
                type="button"
                className="btn-danger"
                onClick={() => onDelete(clerk)}
              >
                <Trash2 size={16} />
                Delete Clerk
              </button>
            </div>
          </section>

          {/* Activity */}
          <section className="modal-section">
            <h3>Recent Activity</h3>
            {formattedActivity.length === 0 ? (
              <p className="empty-text">
                No activity loaded yet. (You can wire this to
                <code> /api/admin/activity?clerkId=... </code> later.)
              </p>
            ) : (
              <ul className="activity-list">
                {formattedActivity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <span className="activity-main">{item.description}</span>
                    <span className="activity-meta">
                      {new Date(item.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Shift stats – stubbed for now */}
          <section className="modal-section">
            <h3>Shift Summary</h3>
            <div className="stats-grid compact">
              <div className="stat-box">
                <span className="stat-number">
                  {clerk.totalCheckIns ?? 0}
                </span>
                <span className="stat-label">Check-ins handled</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">
                  {clerk.incidentCount ?? 0}
                </span>
                <span className="stat-label">Incidents reported</span>
              </div>
              <div className="stat-box">
                <span className="stat-number">
                  {clerk.notesCount ?? 0}
                </span>
                <span className="stat-label">Shift notes</span>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// Main Screen: ClerkRoster
// ============================================================================

const ClerkRoster = () => {
  const isAdmin = useIsAdmin();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    clerks,
    isLoading: clerksLoading,
    error: clerksError,
    refetch: refetchClerks,
    toggleActive,
    deleteClerk,
    importFromFile,
    setSelectedClerk,
    selectedClerk,
    resendInvite
  } = useAdminClerks({
    enabled: true,
    onError: (err) => {
      toast.error(err.message || "Failed to load clerks");
    },
  });

  const adminState = useSelector((state) => state.admin);
  const { residents = [], isLoading: residentsLoading } = adminState;

 const [residentFilters, setResidentFilters] = useState({
  search: "",
  wing: "",
  active: "",
  semester: "",
  year: "",
});

  const [showAddClerkMenu, setShowAddClerkMenu] = useState(false);
  const addClerkFileInputRef = useRef(null);

  const [selectedResident, setSelectedResident] = useState(null);

  // Fetch residents on mount (for admin view)
  useEffect(() => {
    if (!isAdmin) return;
    dispatch(fetchResidentRoster({}));
  }, [dispatch, isAdmin]);

  const availableYears = useMemo(() => {
  const years = (residents || [])
    .map((r) => r.year)
    .filter((y) => typeof y === "number" && !Number.isNaN(y));

  return Array.from(new Set(years)).sort((a, b) => b - a); // newest first
}, [residents]);

const filteredResidents = useMemo(() => {
  let list = residents || [];
  const { search, wing, active, semester, year } = residentFilters;

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.name?.toLowerCase().includes(s) ||
        r.roomNumber?.toLowerCase().includes(s)
    );
  }

  if (wing) {
    // you could also use r.wing === 'North'/'South' if you prefer
    list = list.filter((r) =>
      r.roomNumber?.toUpperCase().startsWith(wing.toUpperCase())
    );
  }

  if (active === "active") {
    list = list.filter((r) => r.active === true);
  } else if (active === "inactive") {
    list = list.filter((r) => r.active === false);
  }

  if (semester) {
    list = list.filter((r) => r.semester === semester);
  }

  if (year) {
    // year is stored as Number in Mongo, select value comes as string
    list = list.filter((r) => String(r.year) === String(year));
  }

  return list;
}, [residents, residentFilters]);

  // ==========================
  // Handler: Add Clerk
  // ==========================

  const handleAddClerkSingle = () => {
  setShowAddClerkMenu(false);
  navigate("/admin/clerks/new", { state: { fromAdmin: true } });
};

const handleCloseResidentModal = () => {
  setSelectedResident(null);
};

// Handle "Add Visitor" from ResidentDetailModal
// This receives the payload passed from ResidentDetailModal.handleAddVisitor:
// { room, hostId, hostName }
const handleAddNewGuestFromResident = (payload) => {

  toast('Opening Add Visitor flow…', {
  });

  // TODO: Wire this to the overlay / AddNewGuest component, e.g.:
  // openAddGuest(payload);
};

// Admin-only delete handler
const handleDeleteResident = (residentToDelete) => {
  if (!residentToDelete) return;

  const { _id, name, roomNumber } = residentToDelete;

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete resident "${name}" (Room ${roomNumber})? This action cannot be undone.`
  );

  if (!confirmed) return;

  // TODO: dispatch your real delete thunk here, e.g.:
  // await dispatch(deleteResident(residentToDelete._id)).unwrap();

  console.log('[ResidentDetailModal] Delete resident requested:', {
    id: _id,
    name,
    roomNumber,
  });

  toast.success(`Resident "${name}" scheduled for deletion`);

  // Optionally close modal after delete
  setSelectedResident(null);
};
  const handleAddClerkFileClick = () => {
    if (addClerkFileInputRef.current) {
      addClerkFileInputRef.current.value = "";
      addClerkFileInputRef.current.click();
    }
  };

  const handleAddClerkFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAddClerkMenu(false);

    try {
      const result = await importFromFile(file);
      toast.success(
        result?.message ||
          `Imported ${result?.successCount || 0} clerk(s) from file`
      );
      refetchClerks();
    } catch (err) {
      console.error("Import clerks error:", err);
      toast.error(
        err?.message || "Failed to import clerks from selected file"
      );
    }
  };

  // ==========================
  // Handlers: Clerk actions
  // ==========================

  const handleToggleActiveClerk = async (clerk) => {
    try {
      await toggleActive(clerk);
      toast.success(
        clerk.isActive ? "Clerk paused" : "Clerk reactivated"
      );
    } catch (err) {
      console.error("Toggle clerk error:", err);
      toast.error(err?.message || "Failed to update clerk status");
    }
  };

  const handleDeleteClerk = async (clerk) => {
    const confirmed = window.confirm(
      `Delete clerk "${clerk.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await deleteClerk(clerk._id);
      toast.success("Clerk deleted");
    } catch (err) {
      console.error("Delete clerk error:", err);
      toast.error(err?.message || "Failed to delete clerk");
    }
  };


  // ==========================
  // Handler: Clerk resend invite
  // ==========================
  const handleResendInvite = async (clerk) => {
  const confirmed = window.confirm(
    `Resend invitation to "${clerk.name}" (${clerk.email})? This will generate a new temporary password and reset link.`
  );
  if (!confirmed) return;

  try {
    await resendInvite(clerk._id);
    toast.success(`Invitation resent to ${clerk.email}`);
  } catch (err) {
    console.error("Resend invite error:", err);
    toast.error(err?.response?.data?.message || err?.message || "Failed to resend invitation");
  }
};

  // ==========================
  // Handler: Resident filters
  // ==========================

  const handleResidentFilterChange = (e) => {
    const { name, value } = e.target;
    setResidentFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResidentCardClick = (resident) => {
    setSelectedResident(resident);
    dispatch(setSelectedResidentLocal(resident));
  };

  if (!isAdmin) {
    return (
      <div className="screen-container">
        <div className="screen-guard">
          <Shield size={32} />
          <h2>Admin Access Only</h2>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-container clerk-roster-screen">
      {/* Header */}
      <header className="screen-header">
        <div className="screen-title-block">
          <h1>Admin Control Center</h1>
          <p className="screen-subtitle">
            Manage clerks, residents, reports, and communications from a
            single, calm dashboard.
          </p>
        </div>

        <div className="header-actions">
          <div className="add-clerk-wrapper">
            <button
              type="button"
              className="btn-primary with-icon"
              onClick={() => setShowAddClerkMenu((s) => !s)}
            >
              <UserPlus size={18} />
              Add Clerk
              <ChevronDown size={16} />
            </button>
            {showAddClerkMenu && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={handleAddClerkSingle}
                >
                  <UserPlus size={16} />
                  Add single clerk
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={handleAddClerkFileClick}
                >
                  <FileSpreadsheet size={16} />
                  Import from CSV / Excel
                </button>
              </div>
            )}
            {/* Hidden file input for batch import */}
            <input
              type="file"
              ref={addClerkFileInputRef}
              style={{ display: "none" }}
              accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleAddClerkFileChange}
            />
          </div>

          <button
            type="button"
            className="btn-ghost with-icon"
            onClick={() => toast("Profile / password screen coming soon")}
          >
            <Settings size={18} />
            Admin Settings
          </button>
        </div>
      </header>

      {/* Two-column layout: Clerks & Residents */}
      <main className="screen-main-grid">
        {/* Left: Clerk roster */}
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Users size={18} /> Clerk Roster
            </h2>
            <button
              type="button"
              className="btn-ghost small"
              onClick={refetchClerks}
            >
              <Activity size={14} />
              Refresh
            </button>
          </div>

          {clerksLoading && (
            <div className="panel-loading">
              <div className="spinner" />
              <p>Loading clerks...</p>
            </div>
          )}

          {clerksError && (
            <div className="panel-error">
              <p>{clerksError.message}</p>
            </div>
          )}

          {!clerksLoading && clerks.length === 0 && !clerksError && (
            <div className="panel-empty">
              <UserPlus size={24} />
              <p>No clerks registered yet.</p>
              <p>Add a clerk to get started.</p>
            </div>
          )}

          <div className="clerk-grid">
            {clerks.map((clerk) => (
              <ClerkCard
                key={clerk._id || clerk.id}
                clerk={clerk}
                onClick={() => setSelectedClerk(clerk)}
                onToggleActive={handleToggleActiveClerk}
                onDelete={handleDeleteClerk}
              />
            ))}
          </div>
        </section>

        {/* Right: Residents roster (admin view) */}
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Users size={18} /> Residents
            </h2>
          </div>

          {/* Filters */}
          <div className="resident-filters">
            <div className="filter-group">
  <Filter size={16} />

  {/* Wing */}
  <select
    name="wing"
    value={residentFilters.wing}
    onChange={handleResidentFilterChange}
  >
    <option value="">All wings</option>
    <option value="N">North wing (N*** )</option>
    <option value="S">South wing (S*** )</option>
  </select>

  {/* Active status */}
  <select
    name="active"
    value={residentFilters.active}
    onChange={handleResidentFilterChange}
  >
    <option value="">All statuses</option>
    <option value="active">Active</option>
    <option value="inactive">Paused / Deactivated</option>
  </select>

  {/* Semester */}
  <select
    name="semester"
    value={residentFilters.semester}
    onChange={handleResidentFilterChange}
  >
    <option value="">All semesters</option>
    <option value="Spring">Spring</option>
    <option value="Summer">Summer</option>
    <option value="Fall">Fall</option>
  </select>

  {/* Year */}
  <select
    name="year"
    value={residentFilters.year}
    onChange={handleResidentFilterChange}
  >
    <option value="">All years</option>
    {availableYears.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </select>
</div>

          </div>

          {residentsLoading && (
            <div className="panel-loading">
              <div className="spinner" />
              <p>Loading residents...</p>
            </div>
          )}

          {!residentsLoading && filteredResidents.length === 0 && (
            <div className="panel-empty">
              <Users size={24} />
              <p>No residents match the current filters.</p>
            </div>
          )}

          <div className="resident-grid">
            {filteredResidents.map((resident) => (
              <button
                key={resident._id || resident.id}
                type="button"
                className="resident-card"
                onClick={() => handleResidentCardClick(resident)}
              >
                <div className="resident-card-top">
                  <span className="resident-name">{resident.name}</span>
                  <span className="resident-room">{resident.roomNumber}</span>
                </div>
                <div className="resident-card-bottom">
                  <span
                    className={`resident-status ${
                      resident.active ? "active" : "inactive"
                    }`}
                  >
                    {resident.active ? "Active" : "Paused"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Lower area: placeholders for analytics / exports / mailbox */}
      <section className="panel wide">
        <div className="panel-header">
          <h2>
            <Activity size={18} /> Activity & Reports
          </h2>
        </div>

        <div className="panel-row">
          <div className="subpanel">
            <h3>Visitation exports</h3>
            <p className="subpanel-text">
              Export visitation logs for a day, week, month, or custom
              range. (Hook this into
              <code> exportVisitationCsv </code>.)
            </p>
            <button
              type="button"
              className="btn-ghost with-icon"
              onClick={() =>
                toast("Export UI/date-range picker coming in next pass")
              }
            >
              <Upload size={16} />
              Export visitation log
            </button>
          </div>

          <div className="subpanel">
            <h3>Mailbox</h3>
            <p className="subpanel-text">
              A dedicated inbox for incident reports and clerk messages.
              (You can later wire this to your email / messaging model.)
            </p>
            <button
              type="button"
              className="btn-ghost with-icon"
              onClick={() =>
                toast("Mailbox view & composer coming in next pass")
              }
            >
              <Mail size={16} />
              Open mailbox
            </button>
          </div>
        </div>
      </section>

      {/* Clerk detail modal */}
      <ClerkDetailModal
        clerk={selectedClerk}
        onClose={() => setSelectedClerk(null)}
        onToggleActive={handleToggleActiveClerk}
        onDelete={handleDeleteClerk}
        onResendInvite={handleResendInvite}  // Add this
        activity={[]}
      />
      {/* Resident detail modal (your existing one, but as admin) */}
      {selectedResident && (
       <ResidentDetailModal
      resident={selectedResident}
      onClose={handleCloseResidentModal}
      onAddNewGuest={handleAddNewGuestFromResident}
      onDeleteResident={handleDeleteResident}
    />


      )}
    </div>
  );
};

export default ClerkRoster;