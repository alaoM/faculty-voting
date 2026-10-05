import React, { useState, useEffect, useCallback } from 'react';
import './reveal.css';
import BackgroundEffects from './BackgroundEffects';
import CategoryMenu from './CategoryMenu';
import CategoryStage from './CategoryStage';
import WinnersSummary from './WinnersSummary';
import RevealSetup from './RevealSetup';
import { ShieldAlert, RefreshCw, LogOut, Lock } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const apiUrl = (endpoint) => `${API_BASE}${endpoint}`;

export default function ResultsReveal({
  adminPin,
  onExitReveal,
  initialCategory = null
}) {
  // Navigation View: 'menu' | 'stage' | 'summary' | 'setup'
  const [view, setView] = useState('menu');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory);
  const [revealedCategoryIds, setRevealedCategoryIds] = useState(new Set());

  // Data State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [frozenAt, setFrozenAt] = useState(null);
  const [categories, setCategories] = useState([]);
  const [eventInfo, setEventInfo] = useState({
    name: 'Annual Faculty Excellence Awards',
    faculty: 'Agricultural and Rural Management Training Institute',
    tagline: 'Celebrating Academic Distinction, Leadership & Outstanding Impact',
    logoUrl: '/armti_logo.png'
  });

  // Presentation FX
  const [showFlash, setShowFlash] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // -------------------------------------------------------------
  // Data Fetching from Server
  // -------------------------------------------------------------
  const fetchRevealData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = adminPin ? { 'x-admin-pin': adminPin } : {};
      const res = await fetch(apiUrl('/api/admin/results/reveal'), { headers });

      if (res.status === 423) {
        const lockedData = await res.json();
        setIsLocked(true);
        setError(lockedData.error || 'Results are currently locked by the election administrator.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to load results (${res.status})`);
      }

      const data = await res.json();
      setIsLocked(Boolean(data.isLocked));
      setIsFrozen(Boolean(data.isFrozen));
      setFrozenAt(data.frozenAt || null);

      if (data.event) {
        setEventInfo(data.event);
      }
      if (Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching reveal data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [adminPin]);

  useEffect(() => {
    fetchRevealData();
  }, [fetchRevealData]);

  // -------------------------------------------------------------
  // Fullscreen Management
  // -------------------------------------------------------------
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen request denied:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Global Keyboard Shortcuts (F key for fullscreen)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // Ignore if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [toggleFullscreen]);

  // -------------------------------------------------------------
  // Snapshot & Branding Actions
  // -------------------------------------------------------------
  const handleUpdateBranding = async (newBranding) => {
    const res = await fetch(apiUrl('/api/admin/results/branding'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      },
      body: JSON.stringify(newBranding)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update branding');
    }
    const result = await res.json();
    if (result.branding) {
      setEventInfo(result.branding);
    }
  };

  const handleToggleLock = async (locked) => {
    const res = await fetch(apiUrl('/api/admin/results/lock'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      },
      body: JSON.stringify({ locked })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to change lock state');
    }
    await fetchRevealData();
  };

  const handleFreezeSnapshot = async () => {
    const res = await fetch(apiUrl('/api/admin/results/freeze'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      },
      body: JSON.stringify({ admin_user: 'Admin Presenter' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to freeze snapshot');
    }
    await fetchRevealData();
  };

  const handleUnfreezeSnapshot = async () => {
    const res = await fetch(apiUrl('/api/admin/results/unfreeze'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminPin ? { 'x-admin-pin': adminPin } : {})
      },
      body: JSON.stringify({ admin_user: 'Admin Presenter' })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to unfreeze snapshot');
    }
    await fetchRevealData();
  };

  const handleSeedDummyVotes = async () => {
    if (!window.confirm('Populate realistic test voting data (up to 10 nominees per category with distinct winners)? This will simulate ballots from the Google Sheet roster.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/admin/seed-dummy-votes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminPin ? { 'x-admin-pin': adminPin } : {})
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to populate test ballots');
      }
      await fetchRevealData();
      alert('Test dummy ballots populated successfully with up to 10 nominees per category!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportSnapshot = () => {
    const exportData = {
      event: eventInfo,
      frozenAt: frozenAt || new Date().toISOString(),
      categories
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ARMTI_Awards_Reveal_Snapshot_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLoadSnapshotFile = (snapshotData) => {
    if (snapshotData.event) {
      setEventInfo(snapshotData.event);
    }
    if (snapshotData.categories) {
      setCategories(snapshotData.categories);
    }
    setIsFrozen(true);
    setFrozenAt(snapshotData.frozenAt || new Date().toISOString());
    setIsLocked(false);
    setError(null);
  };

  // -------------------------------------------------------------
  // Reveal Effects Triggers
  // -------------------------------------------------------------
  const triggerFlashEffect = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 1400);
  };

  const triggerConfettiEffect = () => {
    setConfettiActive(false);
    setTimeout(() => {
      setConfettiActive(true);
    }, 20);
  };

  const handleMarkCategoryRevealed = (catId) => {
    setRevealedCategoryIds((prev) => new Set([...prev, catId]));
  };

  const handleResetAllReveals = () => {
    if (window.confirm('Reset revealed markers for all categories? (This is useful when rehearsing).')) {
      setRevealedCategoryIds(new Set());
    }
  };

  // Current category for Stage view
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const currentCategoryIndex = categories.findIndex((c) => c.id === selectedCategoryId);

  return (
    <div className="reveal-viewport">
      {/* Background Visual Effects */}
      <BackgroundEffects
        showFlash={showFlash}
        confettiActive={confettiActive}
      />

      {/* Loading State */}
      {loading && (
        <div style={{ position: 'relative', zIndex: 20, margin: 'auto', textAlign: 'center' }}>
          <RefreshCw size={36} className="spin" color="var(--reveal-gold-mid)" style={{ animation: 'spin 1.5s linear infinite' }} />
          <h2 className="serif-display gold-gradient-text" style={{ marginTop: '16px' }}>
            Preparing Awards Stage...
          </h2>
        </div>
      )}

      {/* Error & Locked State */}
      {!loading && error && (
        <div style={{ position: 'relative', zIndex: 20, margin: 'auto', textAlign: 'center', maxWidth: '520px', padding: '32px', background: 'rgba(19, 17, 26, 0.85)', borderRadius: '16px', border: '1px solid var(--reveal-card-border)', backdropFilter: 'blur(12px)' }}>
          {isLocked ? (
            <Lock size={44} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
          ) : (
            <ShieldAlert size={44} color="var(--reveal-gold-mid)" style={{ margin: '0 auto 12px auto' }} />
          )}

          <h2 className="serif-display gold-gradient-text" style={{ fontSize: '1.8rem', margin: '0 0 10px 0' }}>
            {isLocked ? 'Results are Locked' : 'Unable to Load Presentation'}
          </h2>
          <p style={{ color: 'var(--reveal-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
            {error}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isLocked && (
              <button
                type="button"
                className="reveal-btn-primary"
                onClick={() => handleToggleLock(false)}
              >
                Unlock Results
              </button>
            )}

            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={fetchRevealData}
            >
              <RefreshCw size={15} /> Retry Connection
            </button>

            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={() => setView('setup')}
            >
              Open Setup & Offline Mode
            </button>

            {onExitReveal && (
              <button
                type="button"
                className="reveal-btn-secondary"
                onClick={onExitReveal}
              >
                <LogOut size={15} /> Exit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Views */}
      {!loading && !error && (
        <>
          {view === 'menu' && (
            <CategoryMenu
              eventInfo={eventInfo}
              categories={categories}
              revealedCategoryIds={revealedCategoryIds}
              onSelectCategory={(catId) => {
                setSelectedCategoryId(catId);
                setView('stage');
              }}
              onOpenSetup={() => setView('setup')}
              onOpenWinners={() => setView('summary')}
              onResetAllReveals={handleResetAllReveals}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          )}

          {view === 'stage' && currentCategory && (
            <CategoryStage
              category={currentCategory}
              categoryIndex={currentCategoryIndex >= 0 ? currentCategoryIndex : 0}
              totalCategories={categories.length}
              eventInfo={eventInfo}
              onBackToMenu={() => setView('menu')}
              onMarkRevealed={handleMarkCategoryRevealed}
              isAlreadyRevealed={revealedCategoryIds.has(currentCategory.id)}
              onTriggerFlash={triggerFlashEffect}
              onTriggerConfetti={triggerConfettiEffect}
            />
          )}

          {view === 'summary' && (
            <WinnersSummary
              eventInfo={eventInfo}
              categories={categories}
              onBackToMenu={() => setView('menu')}
            />
          )}

          {view === 'setup' && (
            <RevealSetup
              eventInfo={eventInfo}
              isLocked={isLocked}
              isFrozen={isFrozen}
              frozenAt={frozenAt}
              onUpdateBranding={handleUpdateBranding}
              onToggleLock={handleToggleLock}
              onFreezeSnapshot={handleFreezeSnapshot}
              onUnfreezeSnapshot={handleUnfreezeSnapshot}
              onExportSnapshot={handleExportSnapshot}
              onLoadSnapshotFile={handleLoadSnapshotFile}
              onSeedDummyVotes={handleSeedDummyVotes}
              onCloseSetup={() => setView('menu')}
            />
          )}
        </>
      )}
    </div>
  );
}
