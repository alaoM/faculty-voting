import React from 'react';
import { Award, Settings, Maximize2, Minimize2, Trophy, RotateCcw, CheckCircle2, Users } from 'lucide-react';

export default function CategoryMenu({
  eventInfo,
  categories = [],
  revealedCategoryIds = new Set(),
  onSelectCategory,
  onOpenSetup,
  onOpenWinners,
  onResetAllReveals,
  isFullscreen,
  onToggleFullscreen,
  nomineeLimit = 6,
  onUpdateNomineeLimit
}) {
  const allRevealed = categories.length > 0 && categories.every((cat) => revealedCategoryIds.has(cat.id));
  const revealedCount = categories.filter((cat) => revealedCategoryIds.has(cat.id)).length;

  return (
    <div className="reveal-menu-container">
      {/* Hero Header */}
      <header className="reveal-menu-header">
        {eventInfo.logoUrl && (
          <img
            src={eventInfo.logoUrl}
            alt="Institution Logo"
            className="reveal-menu-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
        <div className="reveal-menu-eyebrow">{eventInfo.faculty || 'ARMTI FACULTY AWARDS'}</div>
        <h1 className="reveal-menu-title serif-display gold-gradient-text">
          {eventInfo.name || 'Annual Faculty Excellence Awards'}
        </h1>

        <div className="ornamental-divider">
          <div className="line" />
          <div className="diamond">❖</div>
          <div className="line" />
        </div>

        {/* Interactive Top Nominees manual input toolbar */}
        <div className="reveal-menu-toolbar">
          <div className="reveal-limit-selector">
            <span className="reveal-limit-selector-label">
              <Users size={16} /> Top Nominees to Show:
            </span>
            <div className="reveal-limit-stepper-wrap">
              <button
                type="button"
                className="reveal-stepper-btn"
                onClick={() => onUpdateNomineeLimit?.(Math.max(1, nomineeLimit - 1))}
                title="Decrease top nominees to show"
                aria-label="Decrease nominees"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="30"
                value={nomineeLimit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1) onUpdateNomineeLimit?.(Math.min(30, val));
                }}
                className="reveal-limit-input"
                title="Manually type the number of top nominees to reveal"
                aria-label="Top nominees input"
              />
              <button
                type="button"
                className="reveal-stepper-btn"
                onClick={() => onUpdateNomineeLimit?.(Math.min(30, nomineeLimit + 1))}
                title="Increase top nominees to show"
                aria-label="Increase nominees"
              >
                +
              </button>
            </div>

            <div className="reveal-preset-chips">
              {[3, 5, 6, 8, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`reveal-preset-chip ${nomineeLimit === preset ? 'active' : ''}`}
                  onClick={() => onUpdateNomineeLimit?.(preset)}
                >
                  Top {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Category Grid */}
      <main className="reveal-category-grid" role="grid" aria-label="Award Categories">
        {categories.map((cat, idx) => {
          const isRevealed = revealedCategoryIds.has(cat.id);
          const isManual = Boolean(cat.isManualAward || cat.awardType === 'MANUAL');
          const totalNominees = cat.nominees?.length || 0;
          const nomineeCount = isManual ? totalNominees : Math.min(nomineeLimit, totalNominees);

          return (
            <div
              key={cat.id}
              role="button"
              tabIndex={0}
              aria-label={`${isManual ? 'Special Award' : `Category ${idx + 1}`}: ${cat.name}, ${nomineeCount} honorees`}
              className={`reveal-category-card ${isRevealed ? 'revealed' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory(cat.id);
                }
              }}
            >
              <div className="reveal-card-body">
                <div className="reveal-card-num">
                  {isManual ? '★ Special Recognition' : `Category ${idx + 1}`}
                </div>
                <h2 className="reveal-card-title">{cat.name}</h2>
              </div>

              <div className="reveal-card-meta">
                <span className="reveal-card-count">
                  {isManual
                    ? 'Executive Honors'
                    : nomineeCount <= 1
                    ? `${nomineeCount} Nominee`
                    : `Top ${nomineeCount} Nominees`}
                </span>
                {isRevealed ? (
                  <span className="reveal-card-revealed-tag">
                    <CheckCircle2 size={13} /> Revealed • Replay
                  </span>
                ) : (
                  <span className="reveal-card-ready-tag">
                    Ready ➔
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer Controls */}
      <footer className="reveal-menu-footer">
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="reveal-btn-secondary"
            onClick={onOpenSetup}
            title="Configure branding and results snapshot settings"
          >
            <Settings size={16} /> Setup
          </button>

          {revealedCount > 0 && (
            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={onResetAllReveals}
              title="Reset revealed statuses for presentation rehearsal"
            >
              <RotateCcw size={14} /> Reset State
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {allRevealed ? (
            <button
              type="button"
              className="reveal-btn-primary"
              onClick={onOpenWinners}
              style={{ animation: 'winnerGlowPulse 2s infinite alternate' }}
            >
              <Trophy size={18} /> See All Winners
            </button>
          ) : (
            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={onOpenWinners}
              title="View current winners list"
            >
              <Trophy size={16} /> Winners Summary
            </button>
          )}

          <button
            type="button"
            className="reveal-btn-secondary"
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </footer>
    </div>
  );
}
