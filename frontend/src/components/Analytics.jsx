// frontend/src/components/Analytics.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGuests, useCheckedInGuests } from '../hooks/useGuestsQuery';
import { toast } from 'react-hot-toast';
import './Analytics.css';

// lucide-react icons
import {
  Users,
  BarChart2,
  Calendar,
  Clock,
  Building2,
  TrendingUp,
  TrendingDown,
  Flag,
  LogIn,
  LogOut,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Activity,
  Bell,
} from 'lucide-react';

// ============================================================================
// Icons mapping (so rest of the file can still use Icons.*)
// ============================================================================
const Icons = {
  Users,
  BarChart: BarChart2,
  Calendar,
  Clock,
  Building: Building2,
  TrendingUp,
  TrendingDown,
  Flag,
  LogIn,
  LogOut,
  Download,
  Filter,
  Refresh: RefreshCw,
  Loader: Loader2,
  Activity,
  Bell,
};

// ============================================================================
// Helper Functions
// ============================================================================

const capitalize = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

const formatTime = (date) => {
  if (!date) return 'N/A';
  const now = new Date();
  const dateObj = new Date(date);
  const diffMs = now - dateObj;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const getTopRooms = (guests) => {
  if (!guests || !Array.isArray(guests)) return [];

  const roomCounts = guests.reduce((acc, guest) => {
    if (guest.room) {
      acc[guest.room] = (acc[guest.room] || 0) + 1;
    }
    return acc;
  }, {});

  return Object.entries(roomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([room, count]) => ({ room, count }));
};

const getRecentActivity = (guests) => {
  if (!guests || !Array.isArray(guests)) return [];

  // Filter and sort guests with check-in times
  const sortedGuests = [...guests]
    .filter((g) => g.checkIn)
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
    .slice(0, 5);

  return sortedGuests.map((guest) => ({
    guest: guest.name || 'Unknown Guest',
    type: guest.isCheckedIn ? 'check-in' : 'check-out',
    time: formatTime(guest.checkIn),
    room: guest.room || 'N/A',
  }));
};

const calculateAverageVisitDuration = (guests) => {
  if (!guests || guests.length === 0) return 'N/A';

  const guestsWithDuration = guests.filter((g) => g.checkIn && g.checkout);
  if (guestsWithDuration.length === 0) return 'N/A';

  const totalDuration = guestsWithDuration.reduce((total, guest) => {
    const checkIn = new Date(guest.checkIn);
    const checkout = new Date(guest.checkout);
    return total + (checkout - checkIn);
  }, 0);

  const avgMs = totalDuration / guestsWithDuration.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

// ============================================================================
// Sub-components
// ============================================================================

const LoadingSpinner = () => (
  <div className="spinner">
    <Icons.Loader />
  </div>
);

const StatCard = ({ title, value, trend, trendValue, color }) => (
  <div className={`stat-card ${color}`}>
    <div className="stat-header">
      <h3>{title}</h3>
    </div>
    <div className="stat-value">{value}</div>
    {trend && (
      <div className={`stat-trend ${trend}`}>
        {trend === 'up' ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
        <span>{trendValue}</span>
      </div>
    )}
  </div>
);

const TimeRangeSelector = ({ value, onChange }) => (
  <div className="time-range-selector">
    <select value={value} onChange={onChange}>
      <option value="today">Today</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="quarter">This Quarter</option>
      <option value="year">This Year</option>
      <option value="all">All Time</option>
    </select>
  </div>
);

const ChartCard = ({ title, children, action }) => (
  <div className="chart-card">
    <div className="chart-header">
      <h3>{title}</h3>
      {action && <div className="chart-action">{action}</div>}
    </div>
    <div className="chart-content">{children}</div>
  </div>
);

const GuestActivityItem = ({ guest, type, time, room }) => (
  <div className="guest-activity-item">
    <div className="activity-icon">
      {type === 'check-in' ? <Icons.LogIn /> : <Icons.LogOut />}
    </div>
    <div className="activity-details">
      <div className="activity-guest">{capitalize(guest)}</div>
      <div className="activity-info">
        <span className="activity-type">
          {type === 'check-in' ? 'Checked in' : 'Checked out'}
        </span>
        {room && <span className="activity-room">• Room {room}</span>}
        <span className="activity-time">• {time}</span>
      </div>
    </div>
  </div>
);

// ============================================================================
// Main Analytics Component
// ============================================================================

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [selectedWing, setSelectedWing] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data using hooks
  const {
    data: allGuests,
    isLoading: isLoadingAllGuests,
    refetch: refetchAllGuests,
  } = useGuests();
  const {
    data: checkedInGuests,
    isLoading: isLoadingCheckedIn,
    refetch: refetchCheckedIn,
  } = useCheckedInGuests();

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!allGuests || !checkedInGuests) return null;

    const now = new Date();
    const oneWeekAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const oneMonthAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const totalGuests = allGuests.length;
    const checkedInCount = checkedInGuests.length;
    const flaggedGuests = allGuests.filter((g) => g.flagged).length;

    const northWingGuests = allGuests.filter(
      (g) => g.wing === 'North'
    ).length;
    const southWingGuests = allGuests.filter(
      (g) => g.wing === 'South'
    ).length;

    const studentGuests = allGuests.filter((g) => g.studentAtOU).length;
    const nonStudentGuests = totalGuests - studentGuests;

    const recentGuests = allGuests.filter((g) => {
      const guestDate = new Date(g.createdAt || g.checkIn || 0);
      return guestDate > oneWeekAgo;
    }).length;

    const averageVisitDuration = calculateAverageVisitDuration(allGuests);

    return {
      totalGuests,
      checkedInCount,
      flaggedGuests,
      northWingGuests,
      southWingGuests,
      studentGuests,
      nonStudentGuests,
      recentGuests,
      averageVisitDuration,
      wingDistribution: [
        {
          wing: 'North',
          count: northWingGuests,
          percentage:
            totalGuests > 0
              ? ((northWingGuests / totalGuests) * 100).toFixed(1)
              : 0,
        },
        {
          wing: 'South',
          count: southWingGuests,
          percentage:
            totalGuests > 0
              ? ((southWingGuests / totalGuests) * 100).toFixed(1)
              : 0,
        },
      ],
      studentDistribution: [
        {
          type: 'Students',
          count: studentGuests,
          percentage:
            totalGuests > 0
              ? ((studentGuests / totalGuests) * 100).toFixed(1)
              : 0,
        },
        {
          type: 'Non-Students',
          count: nonStudentGuests,
          percentage:
            totalGuests > 0
              ? ((nonStudentGuests / totalGuests) * 100).toFixed(1)
              : 0,
        },
      ],
      topRooms: getTopRooms(checkedInGuests),
      recentActivity: getRecentActivity(checkedInGuests),
    };
  }, [allGuests, checkedInGuests]);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (!analyticsData) {
        toast.error('No data to export');
        return;
      }

      const csvData = [
        ['Metric', 'Value'],
        ['Total Guests', analyticsData.totalGuests],
        ['Currently Checked In', analyticsData.checkedInCount],
        ['Flagged Guests', analyticsData.flaggedGuests],
        ['North Wing Guests', analyticsData.northWingGuests],
        ['South Wing Guests', analyticsData.southWingGuests],
        ['Student Guests', analyticsData.studentGuests],
        ['Non-Student Guests', analyticsData.nonStudentGuests],
        ['Recent Guests (7 days)', analyticsData.recentGuests],
        [
          'Average Visit Duration',
          analyticsData.averageVisitDuration,
        ],
      ];

      const csvContent = csvData.map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${
        new Date().toISOString().split('T')[0]
      }.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    refetchAllGuests();
    refetchCheckedIn();
    toast.success('Analytics data refreshed');
  };

  if (isLoadingAllGuests || isLoadingCheckedIn) {
    return (
      <div className="analytics-container loading">
        <div className="loading-content">
          <LoadingSpinner />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-container error">
        <div className="error-content">
          <h3>Unable to Load Analytics</h3>
          <p>Failed to load analytics data. Please try again.</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>
            <Icons.BarChart />
            Analytics Dashboard
          </h1>
          <p className="subtitle">Comprehensive insights and statistics</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <TimeRangeSelector
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            />
            <button
              className="btn btn-outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? <LoadingSpinner /> : <Icons.Download />}
              <span>
                {isExporting ? 'Exporting...' : 'Export Data'}
              </span>
            </button>
            <button className="btn btn-icon" onClick={handleRefresh}>
              <Icons.Refresh />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <StatCard
          title="Total Guests"
          value={analyticsData.totalGuests}
          trend="up"
          trendValue="+12%"
          color="primary"
        />
        <StatCard
          title="Checked In"
          value={analyticsData.checkedInCount}
          trend={analyticsData.checkedInCount > 5 ? 'up' : 'down'}
          trendValue={
            analyticsData.checkedInCount > 5 ? '+8%' : '-3%'
          }
          color="success"
        />
        <StatCard
          title="Flagged Guests"
          value={analyticsData.flaggedGuests}
          trend={analyticsData.flaggedGuests > 0 ? 'up' : 'down'}
          trendValue={
            analyticsData.flaggedGuests > 0 ? '+2' : '0'
          }
          color="warning"
        />
        <StatCard
          title="Avg. Visit Duration"
          value={analyticsData.averageVisitDuration}
          color="info"
        />
      </div>

      {/* Charts and Data Grid */}
      <div className="analytics-grid">
        {/* Wing Distribution */}
        <ChartCard title="Wing Distribution">
          <div className="distribution-chart">
            {analyticsData.wingDistribution.map((item, index) => (
              <div key={item.wing} className="distribution-item">
                <div className="distribution-label">
                  <span className="distribution-wing">
                    {item.wing}
                  </span>
                  <span className="distribution-count">
                    {item.count} guests
                  </span>
                </div>
                <div className="distribution-bar">
                  <div
                    className={`bar-fill wing-${index + 1}`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="bar-percentage">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Student Distribution */}
        <ChartCard title="Student vs Non-Student">
          <div className="student-chart">
            {analyticsData.studentDistribution.map(
              (item, index) => (
                <div key={item.type} className="student-item">
                  <div className="student-label">
                    <span className="student-type">
                      {item.type}
                    </span>
                    <span className="student-percentage">
                      {item.percentage}%
                    </span>
                  </div>
                  <div className="student-bar">
                    <div
                      className={`bar-fill student-${index + 1}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="student-count">
                    {item.count} guests
                  </div>
                </div>
              )
            )}
          </div>
        </ChartCard>

        {/* Top Rooms */}
        <ChartCard
          title="Top Rooms (Most Guests)"
          action={
            <button className="btn btn-sm btn-outline">
              <Icons.Building />
              View All
            </button>
          }
        >
          <div className="top-rooms">
            {analyticsData.topRooms.length > 0 ? (
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Guest Count</th>
                    <th>Wing</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topRooms.map(
                    (room, index) => (
                      <tr
                        key={room.room}
                        className={index < 3 ? 'highlight' : ''}
                      >
                        <td>
                          <span className="room-number">
                            {room.room}
                          </span>
                        </td>
                        <td>
                          <span className="guest-count">
                            {room.count}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`wing-badge ${
                              room.room.charAt(0) === 'N'
                                ? 'north'
                                : 'south'
                            }`}
                          >
                            {room.room.charAt(0) === 'N'
                              ? 'North'
                              : 'South'}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            ) : (
              <div className="no-data">
                <Icons.Building />
                <p>No room data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Recent Activity */}
        <ChartCard
          title="Recent Activity"
          action={
            <button className="btn btn-sm btn-outline">
              <Icons.Calendar />
              View All
            </button>
          }
        >
          <div className="recent-activity">
            {analyticsData.recentActivity.length > 0 ? (
              <div className="activity-list">
                {analyticsData.recentActivity.map(
                  (activity, index) => (
                    <GuestActivityItem
                      key={index}
                      guest={activity.guest}
                      type={activity.type}
                      time={activity.time}
                      room={activity.room}
                    />
                  )
                )}
              </div>
            ) : (
              <div className="no-data">
                <Icons.Activity />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Insights Summary */}
        <ChartCard title="Key Insights">
          <div className="insights-list">
            <div className="insight-item positive">
              <Icons.TrendingUp />
              <div className="insight-content">
                <h4>Peak Check-in Times</h4>
                <p>Most guests check in between 4 PM - 8 PM</p>
              </div>
            </div>
            <div className="insight-item info">
              <Icons.Clock />
              <div className="insight-content">
                <h4>Average Stay</h4>
                <p>Guests typically stay for 2-3 hours</p>
              </div>
            </div>
            <div className="insight-item warning">
              <Icons.Flag />
              <div className="insight-content">
                <h4>Flagged Guests</h4>
                <p>
                  {analyticsData.flaggedGuests} guests require
                  attention
                </p>
              </div>
            </div>
            <div className="insight-item neutral">
              <Icons.Users />
              <div className="insight-content">
                <h4>Student Ratio</h4>
                <p>
                  {analyticsData.studentGuests} student guests (
                  {
                    analyticsData.studentDistribution[0]
                      .percentage
                  }
                  %)
                </p>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Export Options */}
        <ChartCard title="Data Export">
          <div className="export-options">
            <p className="export-description">
              Export analytics data for reporting and analysis
            </p>
            <div className="export-buttons">
              <button
                className="btn btn-outline"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <Icons.Download />
                CSV Export
              </button>
              <button className="btn btn-outline" disabled>
                <Icons.Download />
                PDF Report
              </button>
              <button className="btn btn-outline" disabled>
                <Icons.Download />
                Excel Spreadsheet
              </button>
            </div>
            <div className="export-note">
              <small>
                Note: CSV export includes all current analytics
                data. Other formats coming soon.
              </small>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Footer Stats */}
      <div className="analytics-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span className="stat-label">Data Last Updated</span>
            <span className="stat-value">
              {new Date().toLocaleString()}
            </span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Total Records</span>
            <span className="stat-value">
              {analyticsData.totalGuests}
            </span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Coverage Period</span>
            <span className="stat-value">All Time</span>
          </div>
        </div>
        <div className="footer-actions">
          <button
            className="btn btn-sm btn-outline"
            onClick={handleRefresh}
          >
            <Icons.Refresh />
            Refresh Data
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={handleExportData}
          >
            <Icons.Download />
            Export All
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
