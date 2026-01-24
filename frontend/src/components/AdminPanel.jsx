import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchResidentRoster,
  setSelectedResidentLocal,
  importResidents,
  createResidentAdmin,
} from "../features/admin/adminSlice";
import { useOverlays } from "../overlays/OverlayProvider";
import useAdminClerks from "../hooks/useAdminClerks";
import ResidentDetailModal from "./ResidentDetailModal";
import CreateResidentModal from "./CreateResidentModal";
import { useIsAdmin } from "../hooks/useIsAdmin";
import "./AdminPanel.css";
import { adminCreateClerk } from "../features/auth/authSlice";
import CreateClerkModal from "./CreateClerkModal";


import {
  Shield,
  UserCog,
  UserX,
  UserCheck,
  UserPlus,
  Users,
  FileSpreadsheet,
  Upload,
  Trash2,
  Mail,
  Settings,
  Activity,
  ChevronDown,
  X,
  Home,
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
        e.stopPropagation();
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

const ClerkDetailModal = ({
  clerk,
  onClose,
  onToggleActive,
  onResendInvite,
  onDelete,
  activity = [],
}) => {
  if (!clerk) return null;

  const isPendingSetup = clerk.needsPasswordReset || clerk.passwordResetToken;
  const isExpired =
    clerk.passwordResetExpires &&
    new Date(clerk.passwordResetExpires) < new Date();

  const initials = (clerk.name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formattedActivity = activity.slice(0, 5);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container clerk-modal"
        onClick={(e) => e.stopPropagation()}
      >
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
                  <span
                    className={`status-pill ${
                      isExpired ? "expired" : "pending"
                    }`}
                  >
                    {isExpired ? "⚠️ Invite Expired" : "⏳ Pending Setup"}
                  </span>
                )}
              </div>
              <div className="clerk-contact-row">
                <span>{clerk.email}</span>
                {clerk.phone && <span>• {clerk.phone}</span>}
              </div>
            </div>
          </div>

          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
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

              {isPendingSetup && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onResendInvite(clerk)}
                >
                  <Mail size={16} />
                  {isExpired ? "Resend Expired Invite" : "Resend Invitation"}
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

          <section className="modal-section">
            <h3>Recent Activity</h3>
            {formattedActivity.length === 0 ? (
              <p className="empty-text">
                No activity loaded yet. (Wire to{" "}
                <code>/api/admin/activity?clerkId=...</code> later.)
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
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Screen: AdminPanel
// ============================================================================
const AdminPanel = () => {
  const isAdmin = useIsAdmin();
  const dispatch = useDispatch();
  const { openAddGuest } = useOverlays();

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
    resendInvite,
  } = useAdminClerks({
    enabled: true,
    onError: (err) => toast.error(err.message || "Failed to load clerks"),
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
    const [showCreateClerkModal, setShowCreateClerkModal] = useState(false);
  const [creatingClerk, setCreatingClerk] = useState(false);

  // Resident create/import menu + modal
  const [showAddResidentMenu, setShowAddResidentMenu] = useState(false);
  const addResidentFileInputRef = useRef(null);
  const [showCreateResidentModal, setShowCreateResidentModal] = useState(false);
  const [creatingResident, setCreatingResident] = useState(false);

  const [selectedResident, setSelectedResident] = useState(null);

  // Single source of truth for resident roster refresh
  const refreshResidents = useCallback(() => {
    if (!isAdmin) return;
    dispatch(fetchResidentRoster({}));
  }, [dispatch, isAdmin]);

  useEffect(() => {
    refreshResidents();
  }, [refreshResidents]);

  const availableYears = useMemo(() => {
    const years = (residents || [])
      .map((r) => r.year)
      .filter((y) => typeof y === "number" && !Number.isNaN(y));
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [residents]);

  const filteredResidents = useMemo(() => {
    let list = residents || [];
    const { search, wing, active, semester, year } = residentFilters;

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(s) ||
          r.roomNumber?.toLowerCase().includes(s) ||
          r.email?.toLowerCase().includes(s)
      );
    }

    if (wing) {
      list = list.filter((r) =>
        r.roomNumber?.toUpperCase().startsWith(wing.toUpperCase())
      );
    }

    if (active === "active") list = list.filter((r) => r.active === true);
    if (active === "inactive") list = list.filter((r) => r.active === false);

    if (semester) list = list.filter((r) => r.semester === semester);
    if (year) list = list.filter((r) => String(r.year) === String(year));

    return list;
  }, [residents, residentFilters]);

  // ==========================
  // Clerk: add/import
  // ==========================
 const handleAddClerkSingle = () => {
  setShowAddClerkMenu(false);
  setShowCreateClerkModal(true);
};


const handleCreateClerk = async (values) => {
  const name = values.name?.trim();
  const email = values.email?.trim();

  if (!name || !email) {
    toast.error("Name and email are required.");
    return;
  }

  setCreatingClerk(true);

  const clerkData = { name, email };

  try {
    // uses the same thunk as Register.jsx admin flow
    await dispatch(adminCreateClerk(clerkData));

    toast.success("Clerk account created successfully");
    setShowCreateClerkModal(false);
    await refetchClerks();
  } catch (err) {
    console.error("Create clerk error:", err);
    const message =
      typeof err === "string"
        ? err
        : err?.response?.data?.message ||
          err?.message ||
          "Failed to create clerk";
    toast.error(message);
  } finally {
    setCreatingClerk(false);
  }
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
        result?.message || `Imported ${result?.successCount || 0} clerk(s)`
      );
      await refetchClerks();
    } catch (err) {
      console.error("Import clerks error:", err);
      toast.error(err?.message || "Failed to import clerks");
    }
  };

  // ==========================
  // Residents: add/import/create
  // ==========================
  const handleAddResidentSingle = () => {
    setShowAddResidentMenu(false);
    setShowCreateResidentModal(true);
  };

  const handleAddResidentFileClick = () => {
    if (addResidentFileInputRef.current) {
      addResidentFileInputRef.current.value = "";
      addResidentFileInputRef.current.click();
    }
  };

  const handleAddResidentFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAddResidentMenu(false);

    try {
      const result = await dispatch(importResidents(file)).unwrap();
      toast.success(
        result?.message || `Imported ${result?.successCount || 0} resident(s)`
      );
      refreshResidents(); // immediately reload roster
    } catch (err) {
      console.error("Import residents error:", err);
      toast.error(err?.message || err || "Failed to import residents");
    }
  };

const handleCreateResident = async (values) => {
  setCreatingResident(true);

  // Normalise + shape exactly what /api/admin/residents expects
  const payload = {
    name: values.name?.trim(),
    roomNumber: values.roomNumber?.trim().toUpperCase(),
    email: values.email?.trim().toLowerCase(),
    phoneNumber: values.phoneNumber?.trim(),
    studentID: values.studentID?.trim(),

    // optional fields
    semester: values.semester || undefined, // 'Spring' | 'Summer' | 'Fall'
    year: values.year ? Number(values.year) : undefined, // backend will parseInt as well
    active:
      typeof values.active === "boolean"
        ? values.active
        : true, // default true if the form doesn't expose a toggle
  };

  // Client-side guard for the backend's required fields
  if (
    !payload.name ||
    !payload.roomNumber ||
    !payload.email ||
    !payload.phoneNumber ||
    !payload.studentID
  ) {
    setCreatingResident(false);
    toast.error("Name, room, email, phone, and student ID are required.");
    return;
  }

  try {
    const res = await dispatch(createResidentAdmin(payload)).unwrap();

    // Backend returns: { message: 'Resident created', resident: {...} }
    toast.success(res?.message || "Resident created");
    setShowCreateResidentModal(false);
    refreshResidents();
  } catch (err) {
    console.error("Create resident error:", err);

    const message =
      typeof err === "string"
        ? err
        : err?.response?.data?.message ||
          err?.message ||
          "Failed to create resident";

    toast.error(message);
  } finally {
    setCreatingResident(false);
  }
};

  // ==========================
  // Clerk actions
  // ==========================
  const handleToggleActiveClerk = async (clerk) => {
    try {
      await toggleActive(clerk);
      toast.success(clerk.isActive ? "Clerk paused" : "Clerk reactivated");
      await refetchClerks();
    } catch (err) {
      console.error("Toggle clerk error:", err);
      toast.error(err?.message || "Failed to update clerk");
    }
  };

  const handleDeleteClerk = async (clerk) => {
    const confirmed = window.confirm(
      `Delete clerk "${clerk.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    const id = clerk._id || clerk.id;

    try {
      await deleteClerk(id);
      toast.success("Clerk deleted");
      if (selectedClerk && (selectedClerk._id || selectedClerk.id) === id) {
        setSelectedClerk(null);
      }
      await refetchClerks();
    } catch (err) {
      console.error("Delete clerk error:", err);
      toast.error(err?.message || "Failed to delete clerk");
    }
  };

  const handleResendInvite = async (clerk) => {
    const confirmed = window.confirm(
      `Resend invitation to "${clerk.name}" (${clerk.email})?`
    );
    if (!confirmed) return;

    try {
      await resendInvite(clerk._id || clerk.id);
      toast.success(`Invitation resent to ${clerk.email}`);
    } catch (err) {
      console.error("Resend invite error:", err);
      toast.error(err?.message || "Failed to resend invitation");
    }
  };

  // ==========================
  // Residents: modal open/close + filters
  // ==========================
  const handleResidentFilterChange = (e) => {
    const { name, value } = e.target;
    setResidentFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResidentCardClick = (resident) => {
    setSelectedResident(resident);
    dispatch(setSelectedResidentLocal(resident));
  };

  const handleCloseResidentModal = () => {
    setSelectedResident(null);
    refreshResidents();
  };

  const handleAddNewGuestFromResident = ({ room, hostId, hostName }) => {
    if (!room || !hostId) {
      toast.error("Missing room or host info for new visitor.");
      return;
    }

    // Open AddNewGuest overlay with prefilled data (same shape as CheckInForm)
    openAddGuest({
      room,
      hostId,
      hostName,
    });

    // Close the resident detail modal so you don't stack overlays
    setSelectedResident(null);
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
            Manage clerks, residents, reports, and communications from a single,
            calm dashboard.
          </p>
        </div>

        <div className="header-actions">


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

      {/* Main two-column layout */}
      <main className="screen-main-grid">
        {/* Left: Clerk roster */}
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Users size={18} /> Clerk Roster
            </h2>
                      {/* Add Clerk dropdown */}
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

        {/* Right: Residents roster */}
        <section className="panel">
          <div className="panel-header">
            <h2>
              <Home size={18} /> Residents
            </h2>
              <div className="add-clerk-wrapper">
                <button
                  type="button"
                  className="btn-primary small with-icon"
                  onClick={() => setShowAddResidentMenu((s) => !s)}
                >
                  <Home size={16} />
                  Add Resident
                  <ChevronDown size={14} />
                </button>

                {showAddResidentMenu && (
                  <div className="dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleAddResidentSingle}
                    >
                      <UserPlus size={16} />
                      Add single resident
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={handleAddResidentFileClick}
                    >
                      <FileSpreadsheet size={16} />
                      Import from CSV / Excel
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  ref={addResidentFileInputRef}
                  style={{ display: "none" }}
                  accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleAddResidentFileChange}
                />
              </div>
              <button
                type="button"
                className="btn-ghost small"
                onClick={refreshResidents}
              >
                <Activity size={14} />
                Refresh
              </button>


            </div>

          {/* Filters */}
          <div className="resident-filters">
            <div className="filter-group">

              <input
                type="text"
                name="search"
                className="filter-search-box"
                placeholder="Search by name, room, or email"
                value={residentFilters.search}
                onChange={handleResidentFilterChange}
              />

              <select
                name="wing"
                value={residentFilters.wing}
                onChange={handleResidentFilterChange}
              >
                <option value="">All wings</option>
                <option value="N">North wing (N*** )</option>
                <option value="S">South wing (S*** )</option>
              </select>

              <select
                name="active"
                value={residentFilters.active}
                onChange={handleResidentFilterChange}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Paused / Deactivated</option>
              </select>

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

      {/* Lower: activity & exports */}
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
              Export visitation logs for a day, week, month, or custom range.
              (Hook into <code>exportVisitationCsv</code>.)
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
        onResendInvite={handleResendInvite}
        activity={[]}
      />

      {/* Resident detail modal */}
      {selectedResident && (
      <ResidentDetailModal
        resident={selectedResident}
        onClose={handleCloseResidentModal}
        onAddNewGuest={handleAddNewGuestFromResident}
        onAfterDelete={refreshResidents}
      />
    )}
    {/* Add Clerk Modal */}
    {showCreateClerkModal && (
        <CreateClerkModal
          isOpen={showCreateClerkModal}
          onClose={() => setShowCreateClerkModal(false)}
          onSubmit={handleCreateClerk}
          isSubmitting={creatingClerk}
        />
      )}


      {/* Create resident modal */}
      {showCreateResidentModal && (
        <CreateResidentModal
          isOpen={showCreateResidentModal}
          onClose={() => setShowCreateResidentModal(false)}
          onSubmit={handleCreateResident}
          isSubmitting={creatingResident}
        />
      )}
    </div>
  );
};

export default AdminPanel;
