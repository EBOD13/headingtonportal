// frontend/src/components/AdminScreen.jsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
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
// Helper to detect admin
// ============================================================================
const useIsAdmin = () => {
  const { clerk } = useSelector((state) => state.auth);
  return Boolean(
    clerk?.isAdmin === true ||
      clerk?.role === 'admin' ||
      clerk?.role === 'superadmin'
  );
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

const AdminUserRow = ({ clerk, index }) => {
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
          // NOTE: This is UI-only for now; wiring to backend can be done next
          onClick={(e) => {
            e.preventDefault();
            // placeholder — wire to backend later
            console.log(
              '[AdminScreen] Toggle admin for',
              clerk._id || clerk.id
            );
          }}
        >
          {isAdmin ? (
            <Icons.ToggleRight size={20} />
          ) : (
            <Icons.ToggleLeft size={20} />
          )}
          <span>{isAdmin ? 'Admin' : 'Standard'}</span>
        </button>
      </td>
      <td>
        <span className="admin-user-status online">Active</span>
      </td>
    </tr>
  );
};

// ============================================================================
// Main Component
// ============================================================================
const AdminScreen = () => {
  // 🔹 ALL hooks at the top, no conditions
  const { clerk } = useSelector((state) => state.auth);
  const isAdmin = useIsAdmin();

  // For now, fake a tiny list using the logged-in clerk as an example.
  // Later we can replace this with a real "useClerks()" hook calling your backend.
  const clerks = useMemo(() => {
    if (!clerk) return [];
    return [
      {
        id: clerk.id || clerk._id || 'me',
        name: clerk.name || clerk.fullName || 'Current Clerk',
        email: clerk.email,
        role: clerk.role || (clerk.isAdmin ? 'admin' : 'clerk'),
        isAdmin: clerk.isAdmin,
      },
      // add more mock rows if you want the layout to feel fuller
    ];
  }, [clerk]);

  const totalClerks = clerks.length;
  const adminCount = clerks.filter(
    (c) => c.role === 'admin' || c.isAdmin
  ).length;
  const nonAdminCount = totalClerks - adminCount;

  // 🔹 Guard AFTER hooks, so hooks always run in the same order
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>
            <Icons.Shield size={26} />
            Admin Control Center
          </h1>
          <p className="admin-subtitle">
            Manage clerks, roles, and system configuration
          </p>
        </div>
        <div className="admin-header-right">
          <div className="admin-search">
            <Icons.Search size={16} />
            <input
              type="text"
              placeholder="Search clerks by name or email..."
              // Wire later to real filtering
              onChange={() => {}}
            />
          </div>
          <button
            type="button"
            className="admin-icon-btn"
            onClick={() => window.location.reload()}
          >
            <Icons.Refresh size={18} />
          </button>
        </div>
      </header>

      {/* Top stats */}
      <section className="admin-stats">
        <AdminStatCard
          icon={Icons.Users}
          label="Total Clerks"
          value={totalClerks}
          description="Registered staff accounts with portal access"
        />
        <AdminStatCard
          icon={Icons.Shield}
          label="Admins"
          value={adminCount}
          description="Users with elevated permissions"
        />
        <AdminStatCard
          icon={Icons.Activity}
          label="Non-Admin Clerks"
          value={nonAdminCount}
          description="Standard operational roles"
        />
        <AdminStatCard
          icon={Icons.Settings}
          label="Access Level"
          value="Super Admin"
          description="You can manage roles & system settings"
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
            {clerks.length === 0 ? (
              <div className="admin-empty-state">
                <Icons.Users size={40} />
                <p>
                  No clerks found yet. Once users register, they will
                  appear here.
                </p>
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
                  {clerks.map((c, index) => (
                    <AdminUserRow
                      key={c.id || index}
                      clerk={c}
                      index={index}
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
                <h3>Role management coming next</h3>
                <p>
                  This panel will show recent admin events: role
                  changes, flagged guests, and configuration updates
                  pulled from your Activity collection.
                </p>
              </div>
            </div>

            <div className="admin-activity-item">
              <div className="admin-activity-icon">
                <Icons.Settings size={16} />
              </div>
              <div className="admin-activity-content">
                <h3>Connect to backend</h3>
                <p>
                  Once wired, you&apos;ll be able to promote/demote
                  clerks, lock accounts, and view audit logs—all from
                  this screen.
                </p>
              </div>
            </div>

            <div className="admin-activity-note">
              Tip: keep admin count small and review access regularly.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminScreen;
