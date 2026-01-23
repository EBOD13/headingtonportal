// frontend/src/components/AdminScreen.jsx
import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useCurrentClerk, useIsAdmin } from '../hooks/useIsAdmin';
import { useClerksAdmin } from '../hooks/useClerksAdmin';
import './AdminScreen.css';

// ============================================================================
// Icons (lucide-react style imports)
// ============================================================================
import {
  Shield,
  Users,
  Activity,
  Settings as SettingsIcon,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const Icons = {
  Shield,
  Users,
  Activity,
  Settings: SettingsIcon,
  Refresh: RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
};

// ============================================================================
// Sub-components
// ============================================================================
const AdminStatCard = ({ icon: Icon, label, value, description }) => (
  <div className="admin-stat-card">
    <div className="admin-stat-header">
      <div className="admin-stat-icon">
        <Icon size={18} />
      </div>
      <span className="admin-stat-label">{label}</span>
    </div>
    <div className="admin-stat-value">{value}</div>
    {description && (
      <p className="admin-stat-description">{description}</p>
    )}
  </div>
);

const AdminUserRow = ({
  clerk,
  index,
  onToggleAdmin,
  isTogglingForThisRow,
}) => {
  const isAdmin = Boolean(
    clerk.isAdmin === true ||
      clerk.role === 'admin' ||
      clerk.role === 'superadmin'
  );

  const initials = useMemo(() => {
    if (!clerk.name) return 'HH';
    const parts = clerk.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clerk.name.substring(0, 2).toUpperCase();
  }, [clerk.name]);

  return (
    <tr className={index % 2 === 0 ? 'admin-row-alt' : ''}>
      <td>
        <div className="admin-user-cell">
          <div className="admin-avatar">{initials}</div>
          <div className="admin-user-meta">
            <span className="admin-user-name">
              {clerk.name || 'Unknown'}
            </span>
            <span className="admin-user-email">
              {clerk.email || 'No email'}
            </span>
          </div>
        </div>
      </td>
      <td>
        <span className="admin-role-badge">
          {clerk.role || (isAdmin ? 'admin' : 'clerk')}
        </span>
      </td>
      <td>
        <button
          type="button"
          className={`admin-toggle-btn ${isAdmin ? 'on' : 'off'}`}
          onClick={(e) => {
            e.preventDefault();
            if (!isTogglingForThisRow) {
              onToggleAdmin(clerk);
            }
          }}
          disabled={isTogglingForThisRow}
        >
          {isAdmin ? (
            <Icons.ToggleRight size={20} />
          ) : (
            <Icons.ToggleLeft size={20} />
          )}
          <span>
            {isTogglingForThisRow
              ? 'Updating...'
              : isAdmin
              ? 'Admin'
              : 'Standard'}
          </span>
        </button>
      </td>
      <td>
        <span className="admin-user-status online">
          Active
        </span>
      </td>
    </tr>
  );
};

// ============================================================================
// Main Component
// ============================================================================
const AdminScreen = () => {
  const isAdmin = useIsAdmin();
  const currentClerk = useCurrentClerk();

  const {
    clerks,
    isLoading,
    isError,
    error,
    refetch,
    toggleAdmin,
    isUpdatingRole,
  } = useClerksAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [togglingId, setTogglingId] = useState(null);


  // Filter clerks by search term
  const filteredClerks = useMemo(() => {
    if (!Array.isArray(clerks)) return [];
    if (!searchTerm.trim()) return clerks;

    const term = searchTerm.toLowerCase();
    return clerks.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [clerks, searchTerm]);

  const totalClerks = filteredClerks.length;
  const adminCount = filteredClerks.filter(
    (c) =>
      c.isAdmin === true ||
      c.role === 'admin' ||
      c.role === 'superadmin'
  ).length;
  const nonAdminCount = totalClerks - adminCount;

  const handleToggleAdmin = async (targetClerk) => {
    const id = targetClerk.id || targetClerk._id;
    if (!id) return;
    try {
      setTogglingId(id);
      await toggleAdmin(targetClerk);
    } finally {
      setTogglingId(null);
    }
  };

  const currentUserRoleLabel = useMemo(() => {
    if (!currentClerk) return 'Unknown';
    if (
      currentClerk.role === 'superadmin' ||
      currentClerk.isSuperAdmin
    ) {
      return 'Super Admin';
    }
    if (
      currentClerk.isAdmin === true ||
      currentClerk.role === 'admin'
    ) {
      return 'Admin';
    }
    return 'Clerk';
  }, [currentClerk]);


    // Guard AFTER hooks so hooks order is stable
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-container">
      {/* Top stats */}
      <section className="admin-stats">
        <AdminStatCard
          icon={Icons.Users}
          label="Total Clerks"
          value={isLoading ? '—' : totalClerks}
          description="Registered staff accounts with portal access"
        />
        <AdminStatCard
          icon={Icons.Shield}
          label="Admins"
          value={isLoading ? '—' : adminCount}
          description="Users with elevated permissions"
        />
        <AdminStatCard
          icon={Icons.Activity}
          label="Non-Admin Clerks"
          value={isLoading ? '—' : nonAdminCount}
          description="Standard operational roles"
        />
        <AdminStatCard
          icon={Icons.Settings}
          label="Access Level"
          value={currentUserRoleLabel}
          description="Your current permission level"
        />
      </section>

      {/* Main grid */}
      <section className="admin-grid">
        {/* Clerks table */}
        <div className="admin-card admin-card--wide">
          <div className="admin-card-header">
            <h2>Clerk & Admin Accounts</h2>
            <p>Review roles and manage elevated access.</p>
          </div>
          <div className="admin-table-wrapper">
            {isLoading ? (
              <div className="admin-empty-state">
                <div className="spinner" />
                <p>Loading clerks...</p>
              </div>
            ) : isError ? (
              <div className="admin-empty-state admin-error">
                <Icons.Activity size={40} />
                <p>
                  {error?.response?.data?.message ||
                    error?.message ||
                    'Failed to load clerks.'}
                </p>
              </div>
            ) : filteredClerks.length === 0 ? (
              <div className="admin-empty-state">
                <Icons.Users size={40} />
                <p>No clerks found. They will appear here once created.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Admin Access</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClerks.map((c, index) => (
                    <AdminUserRow
                      key={c.id || c._id || index}
                      clerk={c}
                      index={index}
                      onToggleAdmin={handleToggleAdmin}
                      isTogglingForThisRow={
                        isUpdatingRole &&
                        togglingId &&
                        (togglingId === c.id || togglingId === c._id)
                      }
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Placeholder for audit / config */}
        <div className="admin-card admin-card--side">
          <div className="admin-card-header">
            <h2>System Activity & Notes</h2>
            <p>High-level view of admin-sensitive events.</p>
          </div>
          <div className="admin-activity">
            <div className="admin-activity-item">
              <div className="admin-activity-icon">
                <Icons.Activity size={16} />
              </div>
              <div className="admin-activity-content">
                <h3>Role management live</h3>
                <p>
                  Use the table on the left to promote/demote clerks. Every
                  change is persisted through your backend.
                </p>
              </div>
            </div>

            <div className="admin-activity-item">
              <div className="admin-activity-icon">
                <Icons.Settings size={16} />
              </div>
              <div className="admin-activity-content">
                <h3>Next step: audit logs</h3>
                <p>
                  Wire this panel into your <code>Activity</code> collection to
                  surface a timeline of high-privilege actions.
                </p>
              </div>
            </div>

            <div className="admin-activity-note">
              Tip: keep the number of admins small and review access regularly.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminScreen;
