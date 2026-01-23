import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { logout } from '../features/auth/authSlice';
import './Settings.css';

// ============================================================================
// Icons
// ============================================================================

const Icons = {
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Database: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

// ============================================================================
// Sub-components
// ============================================================================

const SettingSection = ({ title, icon: Icon, children, className = '' }) => (
  <div className={`setting-section ${className}`}>
    <div className="section-header">
      <div className="section-icon">
        <Icon />
      </div>
      <h3>{title}</h3>
    </div>
    <div className="section-content">
      {children}
    </div>
  </div>
);

const SettingItem = ({ label, description, children, required = false }) => (
  <div className="setting-item">
    <div className="setting-info">
      <label className="setting-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {description && <p className="setting-description">{description}</p>}
    </div>
    <div className="setting-control">
      {children}
    </div>
  </div>
);

const ToggleSwitch = ({ checked, onChange, label }) => (
  <label className="toggle-switch">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="toggle-input"
    />
    <span className="toggle-slider"></span>
    {label && <span className="toggle-label">{label}</span>}
  </label>
);

// ============================================================================
// Main Settings Component
// ============================================================================

const Settings = () => {
  const dispatch = useDispatch();
  const { clerk } = useSelector((state) => state.auth);
  
  // Profile Settings
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: ''
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    guestCheckIns: true,
    guestCheckOuts: false,
    flaggedGuests: true,
    systemAlerts: true,
    weeklyReports: false
  });

  // Privacy & Security
  const [privacy, setPrivacy] = useState({
    autoLogout: true,
    sessionTimeout: 30,
    twoFactorAuth: false,
    dataEncryption: true,
    showBlurredGuests: true
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    theme: 'light',
    fontSize: 'medium',
    sidebarCollapsed: false,
    animations: true,
    highContrast: false
  });

  // System Settings
  const [system, setSystem] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365,
    enableAuditLog: true,
    apiAccess: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    // Load profile from clerk data
    if (clerk) {
      setProfile({
        name: clerk.name || '',
        email: clerk.email || '',
        phone: clerk.phone || '',
        role: 'Administrator',
        department: 'Residence Hall Management'
      });
    }

    // Load settings from localStorage if available
    const savedNotifications = localStorage.getItem('notificationSettings');
    const savedPrivacy = localStorage.getItem('privacySettings');
    const savedAppearance = localStorage.getItem('appearanceSettings');

    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
    if (savedPrivacy) {
      setPrivacy(JSON.parse(savedPrivacy));
    }
    if (savedAppearance) {
      setAppearance(JSON.parse(savedAppearance));
    }
  }, [clerk]);

  // Handle profile changes
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Handle notification toggles
  const handleNotificationToggle = (field) => {
    setNotifications(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle privacy changes
  const handlePrivacyChange = (field, value) => {
    setPrivacy(prev => ({ ...prev, [field]: value }));
  };

  // Handle appearance changes
  const handleAppearanceChange = (field, value) => {
    const newAppearance = { ...appearance, [field]: value };
    setAppearance(newAppearance);
    
    // Apply theme changes immediately
    if (field === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  // Save all settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(notifications));
      localStorage.setItem('privacySettings', JSON.stringify(privacy));
      localStorage.setItem('appearanceSettings', JSON.stringify(appearance));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    setNotifications({
      emailNotifications: true,
      pushNotifications: true,
      guestCheckIns: true,
      guestCheckOuts: false,
      flaggedGuests: true,
      systemAlerts: true,
      weeklyReports: false
    });
    
    setPrivacy({
      autoLogout: true,
      sessionTimeout: 30,
      twoFactorAuth: false,
      dataEncryption: true,
      showBlurredGuests: true
    });
    
    setAppearance({
      theme: 'light',
      fontSize: 'medium',
      sidebarCollapsed: false,
      animations: true,
      highContrast: false
    });
    
    toast.success('Settings reset to defaults');
  };

  // Export settings
  const handleExportSettings = () => {
    const settingsData = {
      profile,
      notifications,
      privacy,
      appearance,
      system,
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(settingsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Settings exported successfully');
  };

  // Clear all data
  const handleClearData = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearData = () => {
    localStorage.removeItem('notificationSettings');
    localStorage.removeItem('privacySettings');
    localStorage.removeItem('appearanceSettings');
    setShowConfirmDialog(false);
    toast.success('Local settings cleared');
  };

  // Get theme options
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Icons.Sun },
    { value: 'dark', label: 'Dark', icon: Icons.Moon },
    { value: 'auto', label: 'Auto', icon: Icons.Settings }
  ];

  // Get session timeout options
  const sessionOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 0, label: 'Never' }
  ];

  // Get backup frequency options
  const backupOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <div className="header-left">
          <h1>
            <Icons.Settings />
            Settings
          </h1>
          <p className="subtitle">Configure your application preferences</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={handleExportSettings}
            >
              <Icons.Download />
              Export
            </button>
            <button 
              className="btn btn-outline"
              onClick={handleResetDefaults}
            >
              <Icons.Refresh />
              Reset
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="settings-tabs">
        {['profile', 'notifications', 'privacy', 'appearance', 'system', 'danger'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="settings-content">
        {activeTab === 'profile' && (
          <SettingSection title="Profile Settings" icon={Icons.User}>
            <SettingItem 
              label="Full Name"
              description="Your name as it appears in the system"
              required
            >
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="setting-input"
                placeholder="Enter your full name"
              />
            </SettingItem>

            <SettingItem 
              label="Email Address"
              description="Used for notifications and account recovery"
              required
            >
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="setting-input"
                placeholder="Enter your email address"
              />
            </SettingItem>

            <SettingItem 
              label="Phone Number"
              description="Optional contact number"
            >
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="setting-input"
                placeholder="Enter your phone number"
              />
            </SettingItem>

            <SettingItem 
              label="Role"
              description="Your role in the system"
            >
              <input
                type="text"
                value={profile.role}
                onChange={(e) => handleProfileChange('role', e.target.value)}
                className="setting-input"
                placeholder="Enter your role"
                disabled
              />
            </SettingItem>

            <SettingItem 
              label="Department"
              description="Department or team you belong to"
            >
              <input
                type="text"
                value={profile.department}
                onChange={(e) => handleProfileChange('department', e.target.value)}
                className="setting-input"
                placeholder="Enter your department"
              />
            </SettingItem>
          </SettingSection>
        )}

        {activeTab === 'notifications' && (
          <SettingSection title="Notification Preferences" icon={Icons.Bell}>
            <SettingItem 
              label="Email Notifications"
              description="Receive notifications via email"
            >
              <ToggleSwitch
                checked={notifications.emailNotifications}
                onChange={() => handleNotificationToggle('emailNotifications')}
                label={notifications.emailNotifications ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Push Notifications"
              description="Receive in-app notifications"
            >
              <ToggleSwitch
                checked={notifications.pushNotifications}
                onChange={() => handleNotificationToggle('pushNotifications')}
                label={notifications.pushNotifications ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Guest Check-ins"
              description="Get notified when guests check in"
            >
              <ToggleSwitch
                checked={notifications.guestCheckIns}
                onChange={() => handleNotificationToggle('guestCheckIns')}
                label={notifications.guestCheckIns ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Guest Check-outs"
              description="Get notified when guests check out"
            >
              <ToggleSwitch
                checked={notifications.guestCheckOuts}
                onChange={() => handleNotificationToggle('guestCheckOuts')}
                label={notifications.guestCheckOuts ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Flagged Guests"
              description="Alerts for flagged or suspicious guests"
            >
              <ToggleSwitch
                checked={notifications.flaggedGuests}
                onChange={() => handleNotificationToggle('flaggedGuests')}
                label={notifications.flaggedGuests ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="System Alerts"
              description="Important system updates and maintenance"
            >
              <ToggleSwitch
                checked={notifications.systemAlerts}
                onChange={() => handleNotificationToggle('systemAlerts')}
                label={notifications.systemAlerts ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Weekly Reports"
              description="Receive weekly summary reports"
            >
              <ToggleSwitch
                checked={notifications.weeklyReports}
                onChange={() => handleNotificationToggle('weeklyReports')}
                label={notifications.weeklyReports ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>
          </SettingSection>
        )}

        {activeTab === 'privacy' && (
          <SettingSection title="Privacy & Security" icon={Icons.Shield}>
            <SettingItem 
              label="Auto Logout"
              description="Automatically log out after period of inactivity"
            >
              <ToggleSwitch
                checked={privacy.autoLogout}
                onChange={() => handlePrivacyChange('autoLogout', !privacy.autoLogout)}
                label={privacy.autoLogout ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            {privacy.autoLogout && (
              <SettingItem 
                label="Session Timeout"
                description="Duration before automatic logout"
              >
                <select
                  value={privacy.sessionTimeout}
                  onChange={(e) => handlePrivacyChange('sessionTimeout', parseInt(e.target.value))}
                  className="setting-select"
                >
                  {sessionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingItem>
            )}

            <SettingItem 
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
            >
              <ToggleSwitch
                checked={privacy.twoFactorAuth}
                onChange={() => handlePrivacyChange('twoFactorAuth', !privacy.twoFactorAuth)}
                label={privacy.twoFactorAuth ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Data Encryption"
              description="Encrypt sensitive data at rest"
            >
              <ToggleSwitch
                checked={privacy.dataEncryption}
                onChange={() => handlePrivacyChange('dataEncryption', !privacy.dataEncryption)}
                label={privacy.dataEncryption ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="Show Blurred Guest Photos"
              description="Blur guest photos by default for privacy"
            >
              <ToggleSwitch
                checked={privacy.showBlurredGuests}
                onChange={() => handlePrivacyChange('showBlurredGuests', !privacy.showBlurredGuests)}
                label={privacy.showBlurredGuests ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>
          </SettingSection>
        )}

        {activeTab === 'appearance' && (
          <SettingSection title="Appearance" icon={Icons.Eye}>
            <SettingItem 
              label="Theme"
              description="Choose your preferred color theme"
            >
              <div className="theme-options">
                {themeOptions.map(theme => (
                  <button
                    key={theme.value}
                    className={`theme-option ${appearance.theme === theme.value ? 'active' : ''}`}
                    onClick={() => handleAppearanceChange('theme', theme.value)}
                  >
                    <span className="theme-icon">
                      <theme.icon />
                    </span>
                    <span className="theme-label">{theme.label}</span>
                    {appearance.theme === theme.value && (
                      <span className="theme-check">
                        <Icons.Check />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </SettingItem>

            <SettingItem 
              label="Font Size"
              description="Adjust the text size"
            >
              <div className="font-size-options">
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    className={`font-size-option ${appearance.fontSize === size ? 'active' : ''}`}
                    onClick={() => handleAppearanceChange('fontSize', size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </SettingItem>

            <SettingItem 
              label="Animations"
              description="Enable or disable interface animations"
            >
              <ToggleSwitch
                checked={appearance.animations}
                onChange={() => handleAppearanceChange('animations', !appearance.animations)}
                label={appearance.animations ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
            >
              <ToggleSwitch
                checked={appearance.highContrast}
                onChange={() => handleAppearanceChange('highContrast', !appearance.highContrast)}
                label={appearance.highContrast ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>
          </SettingSection>
        )}

        {activeTab === 'system' && (
          <SettingSection title="System Settings" icon={Icons.Settings}>
            <SettingItem 
              label="Auto Backup"
              description="Automatically backup system data"
            >
              <ToggleSwitch
                checked={system.autoBackup}
                onChange={() => setSystem(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                label={system.autoBackup ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            {system.autoBackup && (
              <SettingItem 
                label="Backup Frequency"
                description="How often to perform automatic backups"
              >
                <select
                  value={system.backupFrequency}
                  onChange={(e) => setSystem(prev => ({ ...prev, backupFrequency: e.target.value }))}
                  className="setting-select"
                >
                  {backupOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </SettingItem>
            )}

            <SettingItem 
              label="Data Retention"
              description="Days to keep audit logs and records"
            >
              <input
                type="number"
                value={system.dataRetention}
                onChange={(e) => setSystem(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
                className="setting-input"
                min="1"
                max="730"
              />
            </SettingItem>

            <SettingItem 
              label="Audit Log"
              description="Log all system activities for review"
            >
              <ToggleSwitch
                checked={system.enableAuditLog}
                onChange={() => setSystem(prev => ({ ...prev, enableAuditLog: !prev.enableAuditLog }))}
                label={system.enableAuditLog ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>

            <SettingItem 
              label="API Access"
              description="Allow access via API (requires admin approval)"
            >
              <ToggleSwitch
                checked={system.apiAccess}
                onChange={() => setSystem(prev => ({ ...prev, apiAccess: !prev.apiAccess }))}
                label={system.apiAccess ? 'Enabled' : 'Disabled'}
              />
            </SettingItem>
          </SettingSection>
        )}

        {activeTab === 'danger' && (
          <SettingSection title="Danger Zone" icon={Icons.AlertCircle} className="danger-zone">
            <div className="danger-items">
              <SettingItem 
                label="Clear Local Data"
                description="Remove all locally stored settings and preferences"
              >
                <button 
                  className="btn btn-outline btn-danger"
                  onClick={handleClearData}
                >
                  <Icons.Trash />
                  Clear Data
                </button>
              </SettingItem>

              <SettingItem 
                label="Export System Data"
                description="Download a copy of all system data for backup"
              >
                <button 
                  className="btn btn-outline"
                  onClick={handleExportSettings}
                >
                  <Icons.Database />
                  Export Data
                </button>
              </SettingItem>

              <SettingItem 
                label="Log Out"
                description="Sign out from all devices"
              >
                <button 
                  className="btn btn-danger"
                  onClick={() => dispatch(logout())}
                >
                  <Icons.LogOut />
                  Log Out
                </button>
              </SettingItem>
            </div>
          </SettingSection>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-header">
              <Icons.AlertCircle />
              <h3>Confirm Action</h3>
            </div>
            <div className="dialog-content">
              <p>Are you sure you want to clear all local settings data? This action cannot be undone.</p>
            </div>
            <div className="dialog-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmClearData}
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;