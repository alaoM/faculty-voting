import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  Snowflake,
  Download,
  Upload,
  Save,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Tv,
  HelpCircle,
  FileJson
} from 'lucide-react';

export default function RevealSetup({
  eventInfo,
  isLocked,
  isFrozen,
  frozenAt,
  onUpdateBranding,
  onToggleLock,
  onFreezeSnapshot,
  onUnfreezeSnapshot,
  onExportSnapshot,
  onLoadSnapshotFile,
  onSeedDummyVotes,
  onCloseSetup
}) {
  const [formData, setFormData] = useState({
    name: eventInfo.name || '',
    faculty: eventInfo.faculty || '',
    tagline: eventInfo.tagline || '',
    logoUrl: eventInfo.logoUrl || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [lockTargetState, setLockTargetState] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateBranding(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update branding: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!parsed.categories || !Array.isArray(parsed.categories)) {
          throw new Error('Invalid snapshot structure: missing categories array.');
        }
        onLoadSnapshotFile(parsed);
        alert('Snapshot file loaded successfully! Presentation is now running from this offline file.');
        onCloseSetup();
      } catch (err) {
        alert('Error parsing snapshot JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="reveal-setup-container">
      <div className="reveal-setup-modal">
        <h2 className="reveal-setup-title serif-display gold-gradient-text">
          Presentation & Ceremony Setup
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--reveal-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Configure branding, security snapshot, offline mode, and projector parameters
        </p>

        {/* Security & Snapshot Controls */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '16px 20px', border: '1px solid rgba(214,170,70,0.2)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--reveal-gold-mid)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Snowflake size={18} /> Results Security & Snapshot Freezing
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {/* Lock / Unlock Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--reveal-text-muted)', marginBottom: '6px' }}>
                Status: {isLocked ? <span style={{ color: '#ef4444', fontWeight: 600 }}>LOCKED</span> : <span style={{ color: '#22c55e', fontWeight: 600 }}>UNLOCKED</span>}
              </div>
              <button
                type="button"
                className="reveal-btn-secondary"
                style={{ width: '100%', borderColor: isLocked ? '#22c55e' : '#ef4444' }}
                onClick={() => {
                  setLockTargetState(!isLocked);
                  setShowLockConfirm(true);
                }}
              >
                {isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                {isLocked ? 'Unlock Results' : 'Lock Results'}
              </button>
            </div>

            {/* Freeze Snapshot */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--reveal-text-muted)', marginBottom: '6px' }}>
                Snapshot: {isFrozen ? <span style={{ color: 'var(--reveal-gold-light)' }}>Frozen ({new Date(frozenAt).toLocaleTimeString()})</span> : <span>Live Tally</span>}
              </div>
              {isFrozen ? (
                <button
                  type="button"
                  className="reveal-btn-secondary"
                  style={{ width: '100%' }}
                  onClick={onUnfreezeSnapshot}
                >
                  <Snowflake size={15} /> Restore Live Tally
                </button>
              ) : (
                <button
                  type="button"
                  className="reveal-btn-secondary"
                  style={{ width: '100%' }}
                  onClick={onFreezeSnapshot}
                >
                  <Snowflake size={15} /> Freeze Results Snapshot
                </button>
              )}
            </div>
          </div>

          {/* Export & Offline Import & Seeder */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="reveal-btn-secondary"
              style={{ flex: 1 }}
              onClick={onExportSnapshot}
            >
              <Download size={15} /> Export Snapshot (JSON)
            </button>

            <label className="reveal-btn-secondary" style={{ flex: 1, cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={15} /> Load Offline Snapshot File
              <input
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {onSeedDummyVotes && (
            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                className="reveal-btn-secondary"
                style={{ width: '100%', borderColor: '#e6b94a', color: '#fff3b0' }}
                onClick={onSeedDummyVotes}
                title="Populate test voting ballots with up to 10 nominees per category"
              >
                🌱 Populate Test Dummy Ballots (Up to 10 Nominees/Category)
              </button>
            </div>
          )}
        </div>

        {/* Branding Form */}
        <form onSubmit={handleSubmit}>
          <div className="reveal-form-group">
            <label className="reveal-form-label">Event / Awards Title</label>
            <input
              type="text"
              className="reveal-form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Annual Faculty Excellence Awards"
              required
            />
          </div>

          <div className="reveal-form-group">
            <label className="reveal-form-label">Faculty / Institution Name</label>
            <input
              type="text"
              className="reveal-form-input"
              value={formData.faculty}
              onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
              placeholder="Agricultural and Rural Management Training Institute"
              required
            />
          </div>

          <div className="reveal-form-group">
            <label className="reveal-form-label">Event Tagline / Subtitle</label>
            <input
              type="text"
              className="reveal-form-input"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="Celebrating Academic Distinction & Outstanding Impact"
            />
          </div>

          <div className="reveal-form-group">
            <label className="reveal-form-label">Logo URL</label>
            <input
              type="text"
              className="reveal-form-input"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="/armti_logo.png"
            />
          </div>

          {saveSuccess && (
            <div style={{ color: '#22c55e', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Branding changes saved successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={onCloseSetup}
            >
              <ChevronLeft size={16} /> Back to Presentation
            </button>

            <button
              type="submit"
              className="reveal-btn-primary"
              disabled={isSaving}
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </form>

        {/* Projector Checklist */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(214,170,70,0.15)', paddingTop: '16px', fontSize: '0.8rem', color: 'var(--reveal-text-dim)' }}>
          <strong style={{ color: 'var(--reveal-gold-mid)' }}>Projector Remote Cheat Sheet:</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', marginTop: '6px' }}>
            <span>• <strong>Space / Enter / Right:</strong> Reveal votes</span>
            <span>• <strong>Left Arrow:</strong> Replay category</span>
            <span>• <strong>Esc:</strong> Return to categories</span>
            <span>• <strong>F:</strong> Toggle Fullscreen</span>
          </div>
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      {showLockConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#171420', border: '1px solid var(--reveal-gold-mid)', borderRadius: '12px', padding: '28px', maxWidth: '440px', textAlign: 'center', color: '#f7f1e1' }}>
            <AlertTriangle size={36} color="var(--reveal-gold-mid)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--reveal-serif)' }}>
              {lockTargetState ? 'Lock Results Reveal?' : 'Unlock Results Reveal?'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--reveal-text-muted)', lineHeight: '1.4', marginBottom: '20px' }}>
              {lockTargetState
                ? 'Locking results will immediately prevent the presentation stage from displaying results. Useful during vote auditing or before the ceremony begins.'
                : 'Unlocking will allow the presentation stage to display live or frozen tallies to the audience.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="reveal-btn-secondary"
                onClick={() => setShowLockConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="reveal-btn-primary"
                onClick={async () => {
                  setShowLockConfirm(false);
                  await onToggleLock(lockTargetState);
                }}
              >
                Confirm {lockTargetState ? 'Lock' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
