import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Award, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  LogOut, 
  ShieldCheck, 
  Printer, 
  Settings, 
  AlertCircle, 
  FileSpreadsheet, 
  RefreshCw, 
  X, 
  UserCheck,
  Clock,
  LayoutGrid,
  Calendar,
  UserPlus,
  RotateCcw,
  UserX,
  History,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // Application Views: 'login' | 'voting' | 'receipt'
  const [view, setView] = useState('login');

  // Core Data State
  const [electionStatus, setElectionStatus] = useState('OPEN');
  const [allowSelfVoting, setAllowSelfVoting] = useState(false);
  const [votingEndTime, setVotingEndTime] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [voter, setVoter] = useState(null);
  const [roster, setRoster] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ballotVotes, setBallotVotes] = useState({});

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, hasDeadline: false, isPast: false });

  // Login Form State
  const [staffIdInput, setStaffIdInput] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Search Nominee Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Admin State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPin, setAdminPin] = useState(null);
  const [adminPinError, setAdminPinError] = useState(null);
  const [adminTab, setAdminTab] = useState('results');
  const [adminResults, setAdminResults] = useState(null);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminVoters, setAdminVoters] = useState([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);
  const [rosterFilterQuery, setRosterFilterQuery] = useState('');
  const [rosterFilterStatus, setRosterFilterStatus] = useState('ALL'); // 'ALL' | 'VOTED' | 'PENDING' | 'MANUAL' | 'INELIGIBLE'

  // Admin Dispute / Action Modal
  const [disputeModal, setDisputeModal] = useState({ isOpen: false, type: 'invalidate', voter: null, reason: '' });
  const [isProcessingDispute, setIsProcessingDispute] = useState(false);

  // Quick-Add Faculty Form (Emergency Bypass)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ staff_id: '', full_name: '', department: '', division: '', training_center: '' });
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);
  const [quickAddError, setQuickAddError] = useState(null);

  // Admin Settings Form State
  const [adminSelfVotingSetting, setAdminSelfVotingSetting] = useState(false);
  const [adminDeadlineInput, setAdminDeadlineInput] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add Category Form
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // -------------------------------------------------------------
  // Initial Lifecycle & Countdown Clock
  // -------------------------------------------------------------
  useEffect(() => {
    fetchStatus();
    fetchRoster();

    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!votingEndTime) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, hasDeadline: false, isPast: false });
      return;
    }

    const calculateTimeLeft = () => {
      const deadline = new Date(votingEndTime).getTime();
      const now = Date.now();
      const diff = deadline - now;

      if (isNaN(deadline)) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, hasDeadline: false, isPast: false });
        return;
      }

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, hasDeadline: true, isPast: true });
        setIsExpired(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, hasDeadline: true, isPast: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [votingEndTime]);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setElectionStatus(data.election_status || 'OPEN');
      setAllowSelfVoting(Boolean(data.allow_self_voting));
      setVotingEndTime(data.voting_end_time || '');
      setIsExpired(Boolean(data.is_expired));

      // Preset admin settings
      setAdminSelfVotingSetting(Boolean(data.allow_self_voting));
      if (data.voting_end_time) {
        try {
          const d = new Date(data.voting_end_time);
          if (!isNaN(d.getTime())) {
            setAdminDeadlineInput(d.toISOString().slice(0, 16));
          }
        } catch (_) {}
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchRoster = async () => {
    try {
      const res = await fetch('/api/voters/roster');
      const data = await res.json();
      setRoster(data.roster || []);
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    }
  };

  // -------------------------------------------------------------
  // Department Badge Helper
  // -------------------------------------------------------------
  const getDeptBadgeClass = (dept) => {
    if (!dept) return 'dept-badge dept-default';
    const d = dept.toLowerCase();
    if (d.includes('agripreneur')) return 'dept-badge dept-agripreneurship';
    if (d.includes('rural')) return 'dept-badge dept-rural';
    if (d.includes('engineer')) return 'dept-badge dept-engineering';
    if (d.includes('agricultural') || d.includes('management')) return 'dept-badge dept-agric-mgmt';
    if (d.includes('planning') || d.includes('research')) return 'dept-badge dept-planning';
    return 'dept-badge dept-default';
  };

  // -------------------------------------------------------------
  // Voter Authentication Flow
  // -------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const trimmedId = staffIdInput.trim();
    if (!trimmedId) return;

    setLoginLoading(true);

    try {
      const res = await fetch('/api/voter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: trimmedId })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || 'Verification failed. Please try again.');
        setLoginLoading(false);
        return;
      }

      setVoter(data.voter);

      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      setCategories(catData.categories || []);
      setCurrentIndex(0);
      setView('voting');
    } catch (err) {
      setLoginError('Unable to connect to the voting server. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = () => {
    setVoter(null);
    setBallotVotes({});
    setStaffIdInput('');
    setLoginError(null);
    setCurrentIndex(0);
    setView('login');
  };

  // -------------------------------------------------------------
  // Nominee Selection & Abstain Logic
  // -------------------------------------------------------------
  const currentCategory = categories[currentIndex];

  const filteredNominees = roster.filter((f) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return f.full_name.toLowerCase().includes(q) || f.department?.toLowerCase().includes(q);
  });

  const handleSelectNominee = (faculty) => {
    if (!currentCategory) return;

    // Self-nomination check (enforced dynamically via allowSelfVoting setting)
    const isSelf = String(faculty.staff_id).trim().toLowerCase() === String(voter?.staff_id).trim().toLowerCase();
    if (isSelf && !allowSelfVoting) {
      alert('Self-nomination is currently disabled by the election committee. Please select a fellow colleague.');
      return;
    }

    setBallotVotes((prev) => ({
      ...prev,
      [currentCategory.id]: {
        category_id: currentCategory.id,
        category_title: currentCategory.title,
        nominee_staff_id: faculty.staff_id,
        nominee_name: faculty.full_name,
        nominee_dept: faculty.department,
        is_abstain: false
      }
    }));

    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    if (!currentCategory) return;
    setBallotVotes((prev) => {
      const copy = { ...prev };
      delete copy[currentCategory.id];
      return copy;
    });
  };

  const handleToggleAbstain = (e) => {
    if (!currentCategory) return;
    if (e.target.checked) {
      setBallotVotes((prev) => ({
        ...prev,
        [currentCategory.id]: {
          category_id: currentCategory.id,
          category_title: currentCategory.title,
          nominee_staff_id: null,
          nominee_name: '__ABSTAIN__',
          nominee_dept: null,
          is_abstain: true
        }
      }));
      setSearchQuery('');
      setShowDropdown(false);
    } else {
      handleClearSelection();
    }
  };

  // -------------------------------------------------------------
  // Ballot Submission Flow
  // -------------------------------------------------------------
  const handleConfirmSubmitBallot = async () => {
    if (!voter) return;
    setIsSubmittingVote(true);

    const votesPayload = categories.map((cat) => {
      const v = ballotVotes[cat.id];
      return {
        category_id: cat.id,
        category_title: cat.title,
        nominee_staff_id: v?.nominee_staff_id || null,
        nominee_name: v?.nominee_name || '__ABSTAIN__',
        nominee_dept: v?.nominee_dept || null
      };
    });

    try {
      const res = await fetch('/api/vote/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: voter.staff_id,
          votes: votesPayload
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Submission failed.');
        setIsSubmittingVote(false);
        return;
      }

      setReceiptData(data);
      setShowReviewModal(false);
      setView('receipt');
    } catch (err) {
      alert('Network error while saving ballot: ' + err.message);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // -------------------------------------------------------------
  // Admin Operations
  // -------------------------------------------------------------
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminPinError(null);

    const pin = adminPinInput.trim();
    if (!pin) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      if (!res.ok) {
        setAdminPinError('Invalid Admin PIN. Access denied.');
        return;
      }

      setAdminPin(pin);
      loadAdminData(pin);
    } catch (err) {
      setAdminPinError('Error connecting to server.');
    }
  };

  const loadAdminData = async (pin = adminPin) => {
    try {
      const resResults = await fetch('/api/admin/results', { headers: { 'x-admin-pin': pin } });
      const dataResults = await resResults.json();
      setAdminResults(dataResults);

      const resCats = await fetch('/api/admin/categories', { headers: { 'x-admin-pin': pin } });
      const dataCats = await resCats.json();
      setAdminCategories(dataCats.categories || []);

      const resVoters = await fetch('/api/admin/voters', { headers: { 'x-admin-pin': pin } });
      const dataVoters = await resVoters.json();
      setAdminVoters(dataVoters.voters || []);

      const resLogs = await fetch('/api/admin/audit-logs', { headers: { 'x-admin-pin': pin } });
      const dataLogs = await resLogs.json();
      setAdminAuditLogs(dataLogs.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    setQuickAddError(null);
    if (!quickAddForm.staff_id.trim() || !quickAddForm.full_name.trim()) {
      setQuickAddError('Staff ID and Full Name are required.');
      return;
    }

    setIsSubmittingQuickAdd(true);
    try {
      const res = await fetch('/api/admin/voters/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify(quickAddForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickAddError(data.error || 'Failed to add faculty member.');
        setIsSubmittingQuickAdd(false);
        return;
      }

      alert(`✅ Emergency Bypass Success: ${data.voter.full_name} (${data.voter.staff_id}) added to eligible faculty roster.`);
      setShowQuickAddModal(false);
      setQuickAddForm({ staff_id: '', full_name: '', department: '', division: '', training_center: '' });
      fetchRoster();
      loadAdminData();
    } catch (err) {
      setQuickAddError('Network error: ' + err.message);
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  const handleOpenDispute = (voter, type) => {
    setDisputeModal({
      isOpen: true,
      type,
      voter,
      reason: type === 'invalidate' ? 'Impersonation dispute / re-vote requested by voter' : 'Identified as non-faculty / ineligible'
    });
  };

  const handleConfirmDisputeAction = async () => {
    if (!disputeModal.voter) return;
    setIsProcessingDispute(true);
    const staffId = disputeModal.voter.staff_id;
    const endpoint = disputeModal.type === 'invalidate' 
      ? `/api/admin/voters/${encodeURIComponent(staffId)}/invalidate`
      : `/api/admin/voters/${encodeURIComponent(staffId)}/revoke`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ reason: disputeModal.reason })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Action failed');
      } else {
        alert(data.message || 'Operation executed successfully.');
        setDisputeModal({ isOpen: false, type: 'invalidate', voter: null, reason: '' });
        fetchRoster();
        loadAdminData();
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsProcessingDispute(false);
    }
  };

  const handleSaveAdminSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({
          allow_self_voting: adminSelfVotingSetting,
          voting_end_time: adminDeadlineInput ? new Date(adminDeadlineInput).toISOString() : ''
        })
      });

      if (res.ok) {
        alert('Election settings saved successfully!');
        fetchStatus();
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSyncGoogleSheet = async () => {
    setIsSyncingRoster(true);
    try {
      const res = await fetch('/api/admin/sync-roster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Google Sheet Sync Complete!\nTotal Rows Parsed: ${data.total_rows}\nUnique Faculty Roster: ${data.unique_faculty}\nNew: ${data.inserted}, Updated: ${data.updated}`);
        fetchRoster();
        loadAdminData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to sync sheet: ' + err.message);
    } finally {
      setIsSyncingRoster(false);
    }
  };

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ title: newCatTitle.trim(), description: newCatDesc.trim(), sort_order: 99 })
      });

      if (res.ok) {
        setNewCatTitle('');
        setNewCatDesc('');
        setShowAddCatForm(false);
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to add category: ' + err.message);
    }
  };

  const handleToggleCatActive = async (catId, currentActive) => {
    try {
      await fetch(`/api/admin/categories/${catId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ is_active: currentActive ? 0 : 1 })
      });
      loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (catId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error);
      } else {
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetElectionPhase = async (status) => {
    try {
      const res = await fetch('/api/admin/election-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setElectionStatus(status);
        alert(`Election status set to: ${status}`);
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleResetElectionVotes = async () => {
    if (!confirm('⚠️ WARNING: This will permanently delete all cast ballots and reset all voter records for fresh testing. Continue?')) return;
    try {
      const res = await fetch('/api/admin/reset-election', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pin': adminPin }
      });
      if (res.ok) {
        alert('All votes cleared successfully.');
        loadAdminData();
      }
    } catch (err) {
      alert('Failed to reset votes');
    }
  };

  // -------------------------------------------------------------
  // Computed Metrics
  // -------------------------------------------------------------
  const totalCategories = categories.length;
  const answeredCount = Object.keys(ballotVotes).length;
  const progressPercentage = totalCategories > 0 ? Math.round((answeredCount / totalCategories) * 100) : 0;
  const currentVote = currentCategory ? ballotVotes[currentCategory.id] : null;

  return (
    <div>
      {/* Background Watermark and Ambient Pattern */}
      <div className="armti-watermark-bg"></div>
      <div className="ambient-pattern"></div>

      <div className="app-wrapper">
        {/* Minimal Institutional Header (No bulky Navbar) */}
        <header className="minimal-header">
          <div className="brand-crest">
            <img src="/armti-logo.png" alt="ARMTI Logo" className="crest-logo-img" />
            <div className="brand-text">
              <h1>ARMTI Faculty Awards</h1>
              <p>Agricultural and Rural Management Training Institute</p>
            </div>
          </div>
          <div className={`status-pill ${isExpired ? 'closed' : electionStatus.toLowerCase()}`}>
            <span className="dot-indicator"></span>
            <span>{isExpired ? 'Voting Concluded' : electionStatus === 'OPEN' ? 'Voting Active' : electionStatus}</span>
          </div>
        </header>

        {/* ===================================================================
             VIEW 1: Voter Login Card (with Live Voting Deadline Countdown)
             =================================================================== */}
        {view === 'login' && (
          <main className="login-container">
            <div className="card-executive">
              <img src="/armti-logo.png" alt="ARMTI Crest" className="login-hero-logo" />
              <h2 className="login-heading">Faculty Voting Portal</h2>
              <p className="login-subheading">
                Please enter your Staff ID to verify eligibility and begin voting for the 2026 Faculty Awards.
              </p>

              {/* Voting Deadline Countdown Widget */}
              {timeLeft.hasDeadline && (
                <div className="countdown-container">
                  <div className="countdown-label-group">
                    <div className="countdown-title">
                      <Clock size={15} />
                      {timeLeft.isPast ? 'Voting Concluded' : 'Voting Closes In'}
                    </div>
                    <div className="countdown-subtitle">
                      {timeLeft.isPast ? 'The deadline has passed' : 'Make sure to submit your ballot in time'}
                    </div>
                  </div>

                  {!timeLeft.isPast && (
                    <div className="countdown-digits-grid">
                      {timeLeft.days > 0 && (
                        <div className="countdown-digit-box">
                          <div className="countdown-digit-num">{timeLeft.days}</div>
                          <div className="countdown-digit-unit">Days</div>
                        </div>
                      )}
                      <div className="countdown-digit-box">
                        <div className="countdown-digit-num">{String(timeLeft.hours).padStart(2, '0')}</div>
                        <div className="countdown-digit-unit">Hrs</div>
                      </div>
                      <div className="countdown-digit-box">
                        <div className="countdown-digit-num">{String(timeLeft.minutes).padStart(2, '0')}</div>
                        <div className="countdown-digit-unit">Min</div>
                      </div>
                      <div className="countdown-digit-box">
                        <div className="countdown-digit-num">{String(timeLeft.seconds).padStart(2, '0')}</div>
                        <div className="countdown-digit-unit">Sec</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loginError && (
                <div className="alert-card error">
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label className="input-label-styled" htmlFor="staffIdInput">
                    ARMTI Staff ID
                  </label>
                  <input
                    id="staffIdInput"
                    type="text"
                    className="input-styled"
                    placeholder="e.g. 1010, 798, 1041"
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <button type="submit" className="btn-solid-primary" disabled={loginLoading || isExpired}>
                  <span>{loginLoading ? 'Verifying...' : isExpired ? 'Voting Closed' : 'Verify Eligibility & Begin'}</span>
                  <ChevronRight size={18} />
                </button>
              </form>
            </div>
          </main>
        )}

        {/* ===================================================================
             VIEW 2: Ballot Studio (Navbar-Free, Smooth Navigation)
             =================================================================== */}
        {view === 'voting' && currentCategory && (
          <main className="card-executive">
            {/* Top Bar with Voter Profile */}
            <div className="ballot-top-bar">
              <div className="voter-profile-chip">
                <div className="avatar-initials">
                  {voter?.full_name
                    ?.split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0].toUpperCase())
                    .join('') || 'FM'}
                </div>
                <div className="profile-meta">
                  <h3>{voter?.full_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className={getDeptBadgeClass(voter?.department)}>{voter?.department || 'ARMTI'}</span>
                    {voter?.division && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {voter.division}</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-outline" 
                  onClick={() => setShowCategoryGrid(true)} 
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  title="View all 21 awards grid"
                >
                  <LayoutGrid size={14} />
                  Awards Grid
                </button>
                <button className="btn-outline" onClick={handleSignOut} style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="stepper-widget">
              <div className="stepper-labels">
                <span>Award {currentIndex + 1} of {totalCategories}</span>
                <span>{progressPercentage}% Completed ({answeredCount}/{totalCategories})</span>
              </div>
              <div className="progress-rail">
                <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / totalCategories) * 100}%` }}></div>
              </div>
            </div>

            {/* Category Quick-Jump Strip */}
            <div className="category-strip">
              {categories.map((cat, idx) => {
                const isVoted = Boolean(ballotVotes[cat.id]);
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={cat.id}
                    className={`strip-pill ${isActive ? 'active' : ''} ${isVoted ? 'voted' : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    <span>#{idx + 1}</span>
                    <span>{cat.title}</span>
                    {isVoted && <CheckCircle2 size={13} style={{ marginLeft: '2px' }} />}
                  </button>
                );
              })}
            </div>

            {/* Active Category Award Card */}
            <div className="award-hero-card">
              <div className="award-number-badge">AWARD {currentIndex + 1} OF {totalCategories}</div>
              <h2 className="award-title-main">{currentCategory.title}</h2>
              <p className="award-desc-text">{currentCategory.description}</p>

              {/* Nominee Autocomplete Search (Staff ID strictly hidden!) */}
              <div className="search-wrapper" ref={searchContainerRef}>
                <label className="input-label-styled">Search & Select Nominee</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} className="search-icon-svg" />
                  <input
                    type="text"
                    className="search-input-box"
                    placeholder="Type colleague's name or department to nominate..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    disabled={currentVote?.is_abstain}
                  />
                </div>

                {/* Suggestions Dropdown (NO Staff ID displayed) */}
                {showDropdown && searchQuery.trim().length > 0 && (
                  <div className="search-dropdown-menu">
                    {filteredNominees.length === 0 ? (
                      <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                        No faculty member found matching "<strong>{searchQuery}</strong>"
                      </div>
                    ) : (
                      filteredNominees.slice(0, 12).map((faculty) => {
                        const isSelf = String(faculty.staff_id).trim().toLowerCase() === String(voter?.staff_id).trim().toLowerCase();
                        return (
                          <div
                            key={faculty.staff_id}
                            className="dropdown-nominee-row"
                            onClick={() => handleSelectNominee(faculty)}
                          >
                            <div>
                              <div className="nominee-row-name">
                                {faculty.full_name} {isSelf && <span style={{ color: 'var(--color-amber)', fontSize: '0.75rem' }}>(You)</span>}
                              </div>
                              <div style={{ marginTop: '3px' }}>
                                <span className={getDeptBadgeClass(faculty.department)}>
                                  {faculty.department || 'ARMTI'}
                                </span>
                                {faculty.division && (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                    {faculty.division}
                                  </span>
                                )}
                              </div>
                            </div>
                            <UserCheck size={16} color="var(--color-primary)" />
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Selected Nominee Card Preview (NO Staff ID displayed) */}
              {currentVote && !currentVote.is_abstain && (
                <div className="selected-nominee-box">
                  <div>
                    <strong>{currentVote.nominee_name}</strong>
                    <div style={{ marginTop: '4px' }}>
                      <span className={getDeptBadgeClass(currentVote.nominee_dept)}>
                        {currentVote.nominee_dept || 'ARMTI Faculty'}
                      </span>
                    </div>
                  </div>
                  <button className="btn-unselect" onClick={handleClearSelection}>
                    ✕ Change Nominee
                  </button>
                </div>
              )}

              {/* Abstain Option */}
              <label className="abstain-check-row">
                <input
                  type="checkbox"
                  checked={Boolean(currentVote?.is_abstain)}
                  onChange={handleToggleAbstain}
                />
                <span>I choose to <strong>Abstain / Skip</strong> this category</span>
              </label>
            </div>

            {/* Bottom Actions Bar */}
            <div className="ballot-actions-bar">
              <button
                className="btn-outline"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={16} />
                Previous Award
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {currentIndex < totalCategories - 1 ? (
                  <button
                    className="btn-outline"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalCategories - 1, prev + 1))}
                  >
                    Next Award
                    <ChevronRight size={16} />
                  </button>
                ) : null}

                <button
                  className="btn-solid-primary"
                  onClick={() => setShowReviewModal(true)}
                  style={{ width: 'auto' }}
                >
                  <Award size={18} />
                  <span>Review & Submit Ballot</span>
                </button>
              </div>
            </div>
          </main>
        )}

        {/* ===================================================================
             VIEW 3: Digital Confirmation Receipt
             =================================================================== */}
        {view === 'receipt' && receiptData && (
          <main className="receipt-wrapper">
            <div className="receipt-icon-badge">
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--color-navy)', marginBottom: '8px' }}>
              Ballot Successfully Recorded
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Thank you for casting your vote in the 2026 ARMTI Faculty Awards.
            </p>

            <div className="receipt-stamp-box">
              <div className="receipt-stamp-title">OFFICIAL VERIFICATION CODE</div>
              <div className="receipt-stamp-code">{receiptData.receipt_code}</div>
            </div>

            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
              Voter: <strong style={{ color: 'var(--text-main)' }}>{receiptData.full_name}</strong><br />
              Timestamp: <span style={{ color: 'var(--text-main)' }}>{new Date(receiptData.voted_at).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-solid-primary" onClick={handleSignOut} style={{ width: 'auto' }}>
                Done & Sign Out
              </button>
            </div>
          </main>
        )}
      </div>

      {/* ===================================================================
           MODAL 1: Awards Grid Overview Modal
           =================================================================== */}
      {showCategoryGrid && (
        <div className="modal-backdrop-styled">
          <div className="modal-sheet-card">
            <div className="modal-sheet-header">
              <h2>All 21 Award Categories</h2>
              <button className="btn-outline" onClick={() => setShowCategoryGrid(false)} style={{ border: 'none', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-sheet-body">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Click any award card below to jump straight to that category on your ballot.
              </p>
              <div className="cat-grid-container">
                {categories.map((cat, idx) => {
                  const isVoted = Boolean(ballotVotes[cat.id]);
                  const vote = ballotVotes[cat.id];
                  const isActive = idx === currentIndex;
                  return (
                    <div
                      key={cat.id}
                      className={`cat-grid-card ${isActive ? 'active' : ''} ${isVoted ? 'voted' : ''}`}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setShowCategoryGrid(false);
                      }}
                    >
                      <div>
                        <div className="cat-grid-num">AWARD #{idx + 1}</div>
                        <div className="cat-grid-title">{cat.title}</div>
                      </div>
                      <div className="cat-grid-status">
                        {isVoted ? (
                          vote?.is_abstain ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Abstained</span>
                          ) : (
                            <span style={{ color: 'var(--color-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={13} /> {vote.nominee_name.split(' ')[0]}
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--color-amber)', fontWeight: 500 }}>⚠️ Pending</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-sheet-footer">
              <button className="btn-solid-primary" onClick={() => setShowCategoryGrid(false)} style={{ width: 'auto' }}>
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
           MODAL 2: Ballot Review Modal
           =================================================================== */}
      {showReviewModal && (
        <div className="modal-backdrop-styled">
          <div className="modal-sheet-card">
            <div className="modal-sheet-header">
              <h2>Review Your Ballot Selections</h2>
              <button className="btn-outline" onClick={() => setShowReviewModal(false)} style={{ border: 'none', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-sheet-body">
              <div className={`alert-card ${answeredCount < totalCategories ? 'warning' : 'info'}`} style={{ marginBottom: '20px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {answeredCount < totalCategories
                    ? `You have ${totalCategories - answeredCount} unselected categories. You may select nominees or choose to abstain before submitting.`
                    : `All ${totalCategories} categories have been reviewed. Ready for final commit.`}
                </span>
              </div>

              <table className="review-table-clean">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>Award Category</th>
                    <th style={{ width: '45%' }}>Your Nominee Choice</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => {
                    const vote = ballotVotes[cat.id];
                    return (
                      <tr key={cat.id}>
                        <td>
                          <strong>{idx + 1}. {cat.title}</strong>
                        </td>
                        <td>
                          {vote ? (
                            vote.is_abstain ? (
                              <span className="nominee-abstain">Abstained (Skipped)</span>
                            ) : (
                              <div>
                                <span className="nominee-picked">{vote.nominee_name}</span>
                                <span style={{ marginLeft: '6px' }}>
                                  <span className={getDeptBadgeClass(vote.nominee_dept)}>
                                    {vote.nominee_dept || 'ARMTI'}
                                  </span>
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="nominee-missing">⚠️ Not Selected</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-row-edit"
                            onClick={() => {
                              setShowReviewModal(false);
                              setCurrentIndex(idx);
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="modal-sheet-footer">
              <button className="btn-outline" onClick={() => setShowReviewModal(false)}>
                Back to Ballot
              </button>
              <button
                className="btn-solid-primary"
                onClick={handleConfirmSubmitBallot}
                disabled={isSubmittingVote}
                style={{ width: 'auto' }}
              >
                <CheckCircle2 size={18} />
                <span>{isSubmittingVote ? 'Committing Ballot...' : 'Confirm & Cast Official Ballot'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
           FLOATING ADMIN TRIGGER (Bottom Right)
           =================================================================== */}
      <button
        className="floating-admin-trigger"
        onClick={() => {
          setShowAdminModal(true);
          if (adminPin) loadAdminData(adminPin);
        }}
        title="Admin Election Portal"
      >
        <Settings size={20} />
      </button>

      {/* ===================================================================
           MODAL 3: Admin Dashboard Suite
           =================================================================== */}
      {showAdminModal && (
        <div className="modal-backdrop-styled">
          <div className="modal-sheet-card" style={{ maxWidth: '960px' }}>
            <div className="modal-sheet-header">
              <h2>ARMTI Election Admin Suite</h2>
              <button className="btn-outline" onClick={() => setShowAdminModal(false)} style={{ border: 'none', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            {!adminPin ? (
              /* Admin PIN Gate */
              <div style={{ padding: '40px 24px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <img src="/armti-logo.png" alt="ARMTI Seal" className="login-hero-logo" style={{ width: '64px', height: '64px', marginBottom: '14px' }} />
                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '6px', color: 'var(--color-navy)' }}>
                  Admin Authentication
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Enter security PIN to access live results & management tools.
                </p>

                {adminPinError && (
                  <div className="alert-card error" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{adminPinError}</span>
                  </div>
                )}

                <form onSubmit={handleAdminLogin}>
                  <input
                    type="password"
                    className="input-styled"
                    placeholder="Enter Admin PIN"
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    style={{ marginBottom: '16px' }}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn-solid-primary">
                    Unlock Dashboard
                  </button>
                </form>
              </div>
            ) : (
              /* Admin Dashboard Main View */
              <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
                {/* Admin Tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <button
                    className={`btn-outline ${adminTab === 'results' ? 'active' : ''}`}
                    onClick={() => { setAdminTab('results'); loadAdminData(); }}
                    style={{ background: adminTab === 'results' ? 'var(--color-primary)' : '#ffffff', color: adminTab === 'results' ? '#ffffff' : 'var(--text-main)' }}
                  >
                    📊 Live Standings
                  </button>
                  <button
                    className={`btn-outline ${adminTab === 'categories' ? 'active' : ''}`}
                    onClick={() => { setAdminTab('categories'); loadAdminData(); }}
                    style={{ background: adminTab === 'categories' ? 'var(--color-primary)' : '#ffffff', color: adminTab === 'categories' ? '#ffffff' : 'var(--text-main)' }}
                  >
                    🏆 Categories Manager
                  </button>
                  <button
                    className={`btn-outline ${adminTab === 'roster' ? 'active' : ''}`}
                    onClick={() => { setAdminTab('roster'); loadAdminData(); }}
                    style={{ background: adminTab === 'roster' ? 'var(--color-primary)' : '#ffffff', color: adminTab === 'roster' ? '#ffffff' : 'var(--text-main)' }}
                  >
                    👥 Faculty Roster & Disputes ({adminVoters.length || roster.length})
                  </button>
                  <button
                    className={`btn-outline ${adminTab === 'audit' ? 'active' : ''}`}
                    onClick={() => { setAdminTab('audit'); loadAdminData(); }}
                    style={{ background: adminTab === 'audit' ? 'var(--color-primary)' : '#ffffff', color: adminTab === 'audit' ? '#ffffff' : 'var(--text-main)' }}
                  >
                    📋 Audit Trail ({adminAuditLogs.length})
                  </button>
                  <button
                    className={`btn-outline ${adminTab === 'controls' ? 'active' : ''}`}
                    onClick={() => setAdminTab('controls')}
                    style={{ background: adminTab === 'controls' ? 'var(--color-primary)' : '#ffffff', color: adminTab === 'controls' ? '#ffffff' : 'var(--text-main)' }}
                  >
                    ⚙️ Election Controls
                  </button>
                </div>

                {/* TAB 1: Live Results */}
                {adminTab === 'results' && adminResults && (
                  <div>
                    <div className="kpi-row-clean">
                      <div className="kpi-block">
                        <div className="kpi-block-label">Turnout Rate</div>
                        <div className="kpi-block-num">{adminResults.turnout.percentage}%</div>
                        <div className="kpi-block-sub">{adminResults.turnout.total_voted} of {adminResults.turnout.total_eligible} faculty</div>
                      </div>
                      <div className="kpi-block">
                        <div className="kpi-block-label">Ballots Cast</div>
                        <div className="kpi-block-num">{adminResults.turnout.total_voted}</div>
                        <div className="kpi-block-sub">Verified submissions</div>
                      </div>
                      <div className="kpi-block">
                        <div className="kpi-block-label">Pending Voters</div>
                        <div className="kpi-block-num">{adminResults.turnout.pending}</div>
                        <div className="kpi-block-sub">Awaiting votes</div>
                      </div>
                      <div className="kpi-block">
                        <div className="kpi-block-label">Total Awards</div>
                        <div className="kpi-block-num">{adminResults.categories.length}</div>
                        <div className="kpi-block-sub">Active categories</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--color-navy)' }}>
                        Category Standings & Winners
                      </h3>
                      <a
                        href={`/api/admin/export-results?admin_pin=${encodeURIComponent(adminPin)}`}
                        className="btn-solid-primary"
                        style={{ width: 'auto', padding: '8px 16px', fontSize: '0.84rem', textDecoration: 'none' }}
                      >
                        <FileSpreadsheet size={16} />
                        Export Official Results (XLSX)
                      </a>
                    </div>

                    {adminResults.categories.map((cat, idx) => (
                      <div key={cat.category_id} className="result-card-clean">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.02rem', color: 'var(--color-navy)' }}>
                            {idx + 1}. {cat.category_title}
                          </h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {cat.total_votes} votes recorded
                          </span>
                        </div>

                        {cat.tallies.length === 0 ? (
                          <p style={{ color: 'var(--text-light)', fontSize: '0.84rem', fontStyle: 'italic' }}>No votes cast yet.</p>
                        ) : (
                          cat.tallies.map((item) => (
                            <div key={item.nominee_name} className="result-bar-wrapper">
                              <div className="result-bar-labels">
                                <span>
                                  {item.rank === 1 && <span className="winner-pill-gold">🏆 1st</span>}
                                  {' '}<strong>{item.nominee_name}</strong>{' '}
                                  <span className={getDeptBadgeClass(item.nominee_dept)}>
                                    {item.nominee_dept || 'ARMTI'}
                                  </span>
                                </span>
                                <span><strong>{item.vote_count} votes</strong> ({item.percentage}%)</span>
                              </div>
                              <div className="result-bar-bg">
                                <div className="result-bar-fill-light" style={{ width: `${item.percentage}%` }}></div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: Categories Manager */}
                {adminTab === 'categories' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>Award Categories</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Add, edit, or toggle categories displayed on the ballot.</p>
                      </div>
                      <button className="btn-solid-primary" onClick={() => setShowAddCatForm(!showAddCatForm)} style={{ width: 'auto', padding: '8px 16px', fontSize: '0.84rem' }}>
                        + Add New Award
                      </button>
                    </div>

                    {showAddCatForm && (
                      <form onSubmit={handleAddCategorySubmit} style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', marginBottom: '20px' }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '0.95rem' }}>Create Award Category</h4>
                        <div style={{ marginBottom: '14px' }}>
                          <label className="input-label-styled">Award Title</label>
                          <input
                            type="text"
                            className="input-styled"
                            value={newCatTitle}
                            onChange={(e) => setNewCatTitle(e.target.value)}
                            placeholder="e.g. Innovator of the Year"
                            required
                          />
                        </div>
                        <div style={{ marginBottom: '14px' }}>
                          <label className="input-label-styled">Description / Criteria</label>
                          <textarea
                            className="input-styled"
                            rows={2}
                            value={newCatDesc}
                            onChange={(e) => setNewCatDesc(e.target.value)}
                            placeholder="Brief description for voters..."
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn-outline" onClick={() => setShowAddCatForm(false)}>Cancel</button>
                          <button type="submit" className="btn-solid-primary" style={{ width: 'auto' }}>Save Award</button>
                        </div>
                      </form>
                    )}

                    {adminCategories.map((cat, idx) => (
                      <div key={cat.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>#{idx + 1} {cat.title} {!cat.is_active && <span style={{ color: 'var(--color-red)', fontSize: '0.75rem' }}>(Disabled)</span>}</strong>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{cat.description}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn-outline" onClick={() => handleToggleCatActive(cat.id, cat.is_active)} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            {cat.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn-outline" onClick={() => handleDeleteCategory(cat.id, cat.title)} style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--color-red)' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: Faculty Roster & Dispute Resolver */}
                {adminTab === 'roster' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>Faculty Roster & Dispute Management</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          Manage voter eligibility, execute emergency bypass additions, or invalidate disputed votes.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-solid-primary"
                          onClick={() => { setQuickAddError(null); setShowQuickAddModal(true); }}
                          style={{ width: 'auto', padding: '8px 14px', fontSize: '0.82rem' }}
                        >
                          <UserPlus size={15} />
                          + Quick Add (Emergency Bypass)
                        </button>
                        <button className="btn-outline" onClick={handleSyncGoogleSheet} disabled={isSyncingRoster} style={{ fontSize: '0.82rem' }}>
                          <RefreshCw size={14} className={isSyncingRoster ? 'spin' : ''} />
                          {isSyncingRoster ? 'Syncing...' : 'Sync Sheet'}
                        </button>
                      </div>
                    </div>

                    {/* Filter controls */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="input-styled"
                        placeholder="Filter by Staff ID, Name, or Department..."
                        value={rosterFilterQuery}
                        onChange={(e) => setRosterFilterQuery(e.target.value)}
                        style={{ flex: 1, minWidth: '220px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                        {[
                          { id: 'ALL', label: 'All' },
                          { id: 'VOTED', label: 'Voted' },
                          { id: 'PENDING', label: 'Pending' },
                          { id: 'MANUAL', label: 'Quick-Added' },
                          { id: 'INELIGIBLE', label: 'Ineligible' }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            className={`btn-outline ${rosterFilterStatus === btn.id ? 'active' : ''}`}
                            onClick={() => setRosterFilterStatus(btn.id)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '6px 10px',
                              background: rosterFilterStatus === btn.id ? 'var(--color-primary)' : '#ffffff',
                              color: rosterFilterStatus === btn.id ? '#ffffff' : 'var(--text-main)'
                            }}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                      <table className="review-table-clean">
                        <thead>
                          <tr>
                            <th style={{ width: '12%' }}>Staff ID</th>
                            <th style={{ width: '30%' }}>Faculty Member</th>
                            <th style={{ width: '22%' }}>Department / Unit</th>
                            <th style={{ width: '16%' }}>Status & Receipt</th>
                            <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminVoters
                            .filter((v) => {
                              // Query match
                              const q = rosterFilterQuery.toLowerCase().trim();
                              const matchesQuery = !q || 
                                v.staff_id.toLowerCase().includes(q) || 
                                v.full_name.toLowerCase().includes(q) || 
                                (v.department && v.department.toLowerCase().includes(q));

                              if (!matchesQuery) return false;

                              // Status filter match
                              if (rosterFilterStatus === 'VOTED') return v.has_voted === 1;
                              if (rosterFilterStatus === 'PENDING') return !v.has_voted && v.is_eligible;
                              if (rosterFilterStatus === 'MANUAL') return Boolean(v.is_manual);
                              if (rosterFilterStatus === 'INELIGIBLE') return !v.is_eligible;
                              return true;
                            })
                            .map((v) => (
                              <tr key={v.staff_id} style={{ opacity: v.is_eligible ? 1 : 0.6 }}>
                                <td>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>
                                    {v.staff_id}
                                  </span>
                                  {Boolean(v.is_manual) && (
                                    <div style={{ marginTop: '2px' }}>
                                      <span className="voter-status-badge manual" title="Manually registered via emergency bypass">
                                        ⚡ Bypass
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <strong>{v.full_name}</strong>
                                </td>
                                <td>
                                  <span className={getDeptBadgeClass(v.department)}>
                                    {v.department || 'ARMTI'}
                                  </span>
                                  {v.division && (
                                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {v.division}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  {!v.is_eligible ? (
                                    <span className="voter-status-badge ineligible">🚫 Ineligible</span>
                                  ) : v.has_voted ? (
                                    <div>
                                      <span className="voter-status-badge voted">✓ Voted</span>
                                      {v.receipt_code && (
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                                          {v.receipt_code}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="voter-status-badge pending">Pending</span>
                                  )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                    {v.has_voted ? (
                                      <button
                                        className="btn-table-action warning"
                                        onClick={() => handleOpenDispute(v, 'invalidate')}
                                        title="Cancel previous vote and allow faculty member to re-cast ballot"
                                      >
                                        <RotateCcw size={12} />
                                        Re-Vote
                                      </button>
                                    ) : null}

                                    {v.is_eligible ? (
                                      <button
                                        className="btn-table-action danger"
                                        onClick={() => handleOpenDispute(v, 'revoke')}
                                        title="Revoke eligibility (non-faculty) and purge any votes"
                                      >
                                        <UserX size={12} />
                                        Revoke
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: '0.72rem', color: 'var(--color-red)', fontWeight: 600 }}>Revoked</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 4: Audit Trail */}
                {adminTab === 'audit' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)' }}>Administrative Override Audit Trail</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          Permanent, chronological ledger of all administrative interventions, ballot invalidations, and emergency registrations.
                        </p>
                      </div>
                      <button className="btn-outline" onClick={() => loadAdminData()} style={{ fontSize: '0.82rem' }}>
                        <RefreshCw size={14} /> Refresh Logs
                      </button>
                    </div>

                    {adminAuditLogs.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                        No administrative override events recorded yet.
                      </div>
                    ) : (
                      <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                        <table className="review-table-clean">
                          <thead>
                            <tr>
                              <th style={{ width: '20%' }}>Timestamp</th>
                              <th style={{ width: '22%' }}>Action</th>
                              <th style={{ width: '28%' }}>Target Faculty / ID</th>
                              <th style={{ width: '30%' }}>Reason / Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminAuditLogs.map((log) => {
                              let tagClass = 'audit-tag-setting';
                              if (log.action_type === 'QUICK_ADD_FACULTY') tagClass = 'audit-tag-quick-add';
                              else if (log.action_type === 'INVALIDATE_BALLOT') tagClass = 'audit-tag-invalidate';
                              else if (log.action_type === 'REVOKE_ELIGIBILITY') tagClass = 'audit-tag-revoke';
                              else if (log.action_type === 'RESET_ELECTION') tagClass = 'audit-tag-reset';
                              else if (log.action_type.includes('CATEGORY')) tagClass = 'audit-tag-category';

                              return (
                                <tr key={log.id}>
                                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                                  </td>
                                  <td>
                                    <span className={`audit-tag ${tagClass}`}>
                                      {log.action_type}
                                    </span>
                                  </td>
                                  <td>
                                    {log.target_name ? (
                                      <div>
                                        <strong>{log.target_name}</strong>
                                        {log.target_staff_id && (
                                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            ID: {log.target_staff_id}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span style={{ color: 'var(--text-muted)' }}>System-Wide</span>
                                    )}
                                  </td>
                                  <td style={{ fontSize: '0.84rem' }}>
                                    {log.reason || '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: Election Controls & Dynamic Settings */}
                {adminTab === 'controls' && (
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', marginBottom: '16px' }}>
                      Election Configuration & Rules
                    </h3>

                    {/* Rule 1: Allow Self-Nomination Toggle */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '16px' }}>
                      <label className="toggle-switch-label">
                        <div>
                          <strong style={{ color: 'var(--color-navy)', fontSize: '0.95rem' }}>Allow Self-Nomination</strong>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                            When enabled, faculty members can select their own name as a nominee.
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="toggle-switch-input"
                          checked={adminSelfVotingSetting}
                          onChange={(e) => setAdminSelfVotingSetting(e.target.checked)}
                        />
                      </label>
                    </div>

                    {/* Rule 2: Voting Deadline Date/Time */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
                      <label className="input-label-styled" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} />
                        Voting Deadline (Automatic Close & Countdown)
                      </label>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px' }}>
                        Sets the live countdown on the voters' login screen. Voting will automatically close when this time arrives.
                      </p>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="datetime-local"
                          className="input-styled"
                          value={adminDeadlineInput}
                          onChange={(e) => setAdminDeadlineInput(e.target.value)}
                          style={{ maxWidth: '300px' }}
                        />
                        <button
                          className="btn-outline"
                          onClick={() => setAdminDeadlineInput('')}
                          type="button"
                          style={{ fontSize: '0.8rem' }}
                        >
                          Clear Deadline
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn-solid-primary"
                      onClick={handleSaveAdminSettings}
                      disabled={isSavingSettings}
                      style={{ width: 'auto', marginBottom: '28px' }}
                    >
                      {isSavingSettings ? 'Saving Settings...' : 'Save Election Rules & Deadline'}
                    </button>

                    {/* Phase Selector */}
                    <div style={{ background: 'var(--bg-subtle)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
                      <label className="input-label-styled">Manual Election Override Phase</label>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <button className="btn-outline" onClick={() => handleSetElectionPhase('OPEN')} style={{ borderColor: electionStatus === 'OPEN' ? 'var(--color-emerald)' : 'var(--border-medium)', background: electionStatus === 'OPEN' ? 'var(--color-emerald-light)' : '#ffffff' }}>
                          🟢 OPEN (Active Voting)
                        </button>
                        <button className="btn-outline" onClick={() => handleSetElectionPhase('PAUSED')} style={{ borderColor: electionStatus === 'PAUSED' ? 'var(--color-amber)' : 'var(--border-medium)', background: electionStatus === 'PAUSED' ? 'var(--color-amber-light)' : '#ffffff' }}>
                          🟡 PAUSE Voting
                        </button>
                        <button className="btn-outline" onClick={() => handleSetElectionPhase('CLOSED')} style={{ borderColor: electionStatus === 'CLOSED' ? 'var(--color-red)' : 'var(--border-medium)', background: electionStatus === 'CLOSED' ? 'var(--color-red-light)' : '#ffffff' }}>
                          🔴 CLOSE Election
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ background: 'var(--color-red-light)', border: '1px solid #fecaca', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                      <h4 style={{ color: '#991b1b', marginBottom: '6px' }}>Danger Zone: Reset All Ballots</h4>
                      <p style={{ color: '#7f1d1d', fontSize: '0.82rem', marginBottom: '14px' }}>
                        Permanently deletes all submitted votes and resets voter statuses for clean testing.
                      </p>
                      <button className="btn-outline" onClick={handleResetElectionVotes} style={{ borderColor: '#f87171', color: '#dc2626' }}>
                        ⚠️ Reset All Votes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
           MODAL 4: Emergency Bypass Quick-Add Modal
           =================================================================== */}
      {showQuickAddModal && (
        <div className="modal-backdrop-styled">
          <div className="modal-sheet-card" style={{ maxWidth: '520px' }}>
            <div className="modal-sheet-header">
              <h2>Emergency Quick-Add Faculty</h2>
              <button className="btn-outline" onClick={() => setShowQuickAddModal(false)} style={{ border: 'none', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit}>
              <div className="modal-sheet-body">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Register a verified ARMTI faculty member directly into the voting roster. Manual additions will never be erased during Google Sheet syncs.
                </p>

                {quickAddError && (
                  <div className="alert-card error" style={{ marginBottom: '16px' }}>
                    <AlertCircle size={16} />
                    <span>{quickAddError}</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <label className="input-label-styled">ARMTI Staff ID *</label>
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="e.g. 1099"
                    value={quickAddForm.staff_id}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, staff_id: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="input-label-styled">Full Name *</label>
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="e.g. Dr. Jane Doe"
                    value={quickAddForm.full_name}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, full_name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="input-label-styled">Department / Unit</label>
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="e.g. Agripreneurship & Enterprise Dev."
                    value={quickAddForm.department}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, department: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label className="input-label-styled">Division</label>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="e.g. Training"
                      value={quickAddForm.division}
                      onChange={(e) => setQuickAddForm({ ...quickAddForm, division: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="input-label-styled">Training Center</label>
                    <input
                      type="text"
                      className="input-styled"
                      placeholder="e.g. Ilorin"
                      value={quickAddForm.training_center}
                      onChange={(e) => setQuickAddForm({ ...quickAddForm, training_center: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-sheet-footer">
                <button type="button" className="btn-outline" onClick={() => setShowQuickAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-solid-primary" disabled={isSubmittingQuickAdd} style={{ width: 'auto' }}>
                  <UserPlus size={16} />
                  <span>{isSubmittingQuickAdd ? 'Registering...' : 'Add Faculty to Roster'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
           MODAL 5: Dispute Resolution / Re-Vote & Revoke Modal
           =================================================================== */}
      {disputeModal.isOpen && disputeModal.voter && (
        <div className="modal-backdrop-styled">
          <div className="modal-sheet-card" style={{ maxWidth: '520px' }}>
            <div className="modal-sheet-header">
              <h2>
                {disputeModal.type === 'invalidate' ? '🔄 Invalidate Ballot & Allow Re-Vote' : '🚫 Revoke Eligibility (Non-Faculty)'}
              </h2>
              <button className="btn-outline" onClick={() => setDisputeModal({ isOpen: false, type: 'invalidate', voter: null, reason: '' })} style={{ border: 'none', padding: '6px' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-sheet-body">
              <div className={`alert-card ${disputeModal.type === 'invalidate' ? 'warning' : 'error'}`} style={{ marginBottom: '16px' }}>
                <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {disputeModal.type === 'invalidate' ? (
                    <>
                      This will permanently <strong>purge all votes cast</strong> under receipt <code>{disputeModal.voter.receipt_code || 'N/A'}</code> and reset <strong>{disputeModal.voter.full_name}</strong> ({disputeModal.voter.staff_id}) so they can cast their ballot again.
                    </>
                  ) : (
                    <>
                      This will mark <strong>{disputeModal.voter.full_name}</strong> ({disputeModal.voter.staff_id}) as <strong>ineligible</strong> and purge any recorded votes from the election tallies.
                    </>
                  )}
                </span>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="input-label-styled">Administrative Justification / Reason *</label>
                <textarea
                  className="input-styled"
                  rows={3}
                  value={disputeModal.reason}
                  onChange={(e) => setDisputeModal({ ...disputeModal, reason: e.target.value })}
                  placeholder="State reason for audit trail (e.g., Staff reported impersonation at 2:15 PM)..."
                  required
                />
              </div>
            </div>

            <div className="modal-sheet-footer">
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDisputeModal({ isOpen: false, type: 'invalidate', voter: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-solid-primary"
                onClick={handleConfirmDisputeAction}
                disabled={isProcessingDispute || !disputeModal.reason.trim()}
                style={{
                  width: 'auto',
                  background: disputeModal.type === 'invalidate' ? 'var(--color-amber)' : 'var(--color-red)'
                }}
              >
                {disputeModal.type === 'invalidate' ? <RotateCcw size={16} /> : <UserX size={16} />}
                <span>{isProcessingDispute ? 'Executing...' : disputeModal.type === 'invalidate' ? 'Confirm Invalidate & Reset' : 'Confirm Revoke Eligibility'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
