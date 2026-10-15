import React, { useState, useMemo } from 'react';
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
  FileJson,
  Users,
  Edit3
} from 'lucide-react';

export default function RevealSetup({
  eventInfo,
  isLocked,
  isFrozen,
  frozenAt,
  nomineeLimit = 6,
  onUpdateNomineeLimit,
  onUpdateBranding,
  onToggleLock,
  onFreezeSnapshot,
  onUnfreezeSnapshot,
  onExportSnapshot,
  onLoadSnapshotFile,
  categories = [],
  onRenameNominee,
  onSeedDummyVotes,
  onCloseSetup
}) {
  const [formData, setFormData] = useState({
    name: eventInfo.name || '',
    faculty: eventInfo.faculty || '',
    tagline: eventInfo.tagline || '',
    logoUrl: eventInfo.logoUrl || '',
    nomineeLimit: nomineeLimit || eventInfo.nomineeLimit || 6
  });

  // Extract all distinct nominees currently appearing in categories
  const allNomineeOptions = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      (cat.nominees || []).forEach((nom) => {
        if (nom.name && !map.has(nom.name)) {
          map.set(nom.name, {
            name: nom.name,
            id: nom.id && !nom.id.startsWith('nom-') && !nom.id.startsWith('manual-') ? nom.id : null,
            department: nom.department || 'ARMTI Faculty'
          });
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const [renameData, setRenameData] = useState({
    staffId: '',
    oldName: '',
    newName: '',
    department: ''
  });
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameSuccess, setRenameSuccess] = useState('');

  const handleSelectNomineeForRename = (e) => {
    const selectedName = e.target.value;
    const found = allNomineeOptions.find((n) => n.name === selectedName);
    if (found) {
      setRenameData({
        staffId: found.id || '',
        oldName: found.name,
        newName: found.name,
        department: found.department || ''
      });
    } else {
      setRenameData({ staffId: '', oldName: selectedName, newName: selectedName, department: '' });
    }
    setRenameSuccess('');
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameData.newName.trim()) return;
    setIsRenaming(true);
    setRenameSuccess('');
    try {
      if (onRenameNominee) {
        const res = await onRenameNominee({
          staffId: renameData.staffId || null,
          oldName: renameData.oldName || null,
          newName: renameData.newName.trim(),
          department: renameData.department?.trim() || null
        });
        setRenameSuccess(`Updated to "${res.newName}" successfully across all ballots and presentation!`);
        setTimeout(() => setRenameSuccess(''), 5000);
      }
    } catch (err) {
      alert('Error updating nominee name: ' + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [lockTargetState, setLockTargetState] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const parsedLimit = Math.max(1, parseInt(formData.nomineeLimit, 10) || 6);
      await onUpdateBranding({ ...formData, nomineeLimit: parsedLimit });
      if (onUpdateNomineeLimit) {
        onUpdateNomineeLimit(parsedLimit);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to update presentation settings: ' + err.message);
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

        {/* Quick Nominee Name & Department Correction Tool */}
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '16px 20px', border: '1px solid rgba(214,170,70,0.2)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--reveal-gold-mid)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} /> Quick Nominee Name & Department Correction
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--reveal-text-muted)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
            Fix typographical errors, honorifics (e.g. Dr., Prof.), or departments directly. Updates automatically apply across all ballots, the roster, and the live awards presentation.
          </p>

          <form onSubmit={handleRenameSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="reveal-form-label" style={{ fontSize: '0.78rem' }}>1. Choose Nominee</label>
                <select
                  className="reveal-form-input"
                  style={{ height: '38px', padding: '6px 10px', cursor: 'pointer' }}
                  value={renameData.oldName}
                  onChange={handleSelectNomineeForRename}
                >
                  <option value="">-- Select from current nominees --</option>
                  {allNomineeOptions.map((nom, idx) => (
                    <option key={`${nom.name}-${idx}`} value={nom.name}>
                      {nom.name} ({nom.department || 'ARMTI'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="reveal-form-label" style={{ fontSize: '0.78rem' }}>2. Corrected Full Name</label>
                <input
                  type="text"
                  className="reveal-form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. Prof. Babatunde Adeniyi"
                  value={renameData.newName}
                  onChange={(e) => setRenameData({ ...renameData, newName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="reveal-form-label" style={{ fontSize: '0.78rem' }}>3. Department (Optional)</label>
                <input
                  type="text"
                  className="reveal-form-input"
                  style={{ height: '38px' }}
                  placeholder="e.g. Training & Development"
                  value={renameData.department}
                  onChange={(e) => setRenameData({ ...renameData, department: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="reveal-btn-secondary"
                style={{ borderColor: 'var(--reveal-gold-mid)', color: 'var(--reveal-gold-light)', padding: '8px 18px', fontSize: '0.85rem' }}
                disabled={isRenaming || !renameData.newName.trim()}
              >
                <Edit3 size={14} /> {isRenaming ? 'Updating Name...' : 'Apply Name Correction'}
              </button>
            </div>
          </form>

          {renameSuccess && (
            <div style={{ color: '#22c55e', fontSize: '0.85rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
              <CheckCircle2 size={16} /> {renameSuccess}
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

          <div className="reveal-form-group">
            <label className="reveal-form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Number of Top Nominees to Show
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="number"
                min="1"
                max="30"
                className="reveal-form-input"
                style={{ width: '100px', textAlign: 'center', fontWeight: 'bold' }}
                value={formData.nomineeLimit}
                onChange={(e) => setFormData({ ...formData, nomineeLimit: e.target.value })}
                required
              />
              <div className="reveal-preset-chips">
                {[3, 5, 6, 8, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`reveal-preset-chip ${Number(formData.nomineeLimit) === num ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, nomineeLimit: num })}
                  >
                    Top {num}
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--reveal-text-muted)', marginTop: '4px', display: 'block' }}>
              Controls how many top vote-receiving nominees are presented and ranked on stage during the award reveals.
            </span>
          </div>

          {saveSuccess && (
            <div style={{ color: '#22c55e', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Presentation settings saved successfully!
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
