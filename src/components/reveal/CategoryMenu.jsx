import React from 'react';
import { Award, Settings, Maximize2, Minimize2, Trophy, RotateCcw, CheckCircle2 } from 'lucide-react';

export default function CategoryMenu({
  eventInfo,
  categories = [],
  revealedCategoryIds = new Set(),
  onSelectCategory,
  onOpenSetup,
  onOpenWinners,
  onResetAllReveals,
  isFullscreen,
  onToggleFullscreen
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
      </header>

      {/* Category Grid */}
      <main className="reveal-category-grid" role="grid" aria-label="Award Categories">
        {categories.map((cat, idx) => {
          const isRevealed = revealedCategoryIds.has(cat.id);
          const isManual = Boolean(cat.isManualAward || cat.awardType === 'MANUAL');
          const nomineeCount = isManual ? (cat.nominees?.length || 0) : Math.min(6, cat.nominees?.length || 0);

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
                    : nomineeCount >= 6
                    ? 'Top 6 Nominees'
                    : `Top ${nomineeCount} ${nomineeCount === 1 ? 'Nominee' : 'Nominees'}`}
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
