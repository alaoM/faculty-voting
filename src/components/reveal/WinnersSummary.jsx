import React from 'react';
import { Trophy, ChevronLeft, Award, Sparkles, Printer, Medal } from 'lucide-react';

export default function WinnersSummary({
  eventInfo,
  categories = [],
  onBackToMenu
}) {
  const getCategoryWinners = (cat) => {
    const rawNominees = cat.nominees || [];
    const isManualAward = Boolean(cat.isManualAward || cat.awardType === 'MANUAL');

    if (isManualAward) {
      return {
        winners: rawNominees,
        isTie: false,
        isManualAward: true,
        winningPercentage: null,
        citation: cat.citation || rawNominees[0]?.citation || ''
      };
    }

    if (!rawNominees.length || cat.totalVotes === 0) {
      return { winners: [], isTie: false, isManualAward: false, winningPercentage: '0.0' };
    }

    const maxVotes = Math.max(...rawNominees.map((n) => Number(n.votes || 0)));
    if (maxVotes <= 0) return { winners: [], isTie: false, isManualAward: false, winningPercentage: '0.0' };

    const winners = rawNominees.filter((n) => Number(n.votes) === maxVotes);
    const winningPercentage = winners[0]?.percentage || (cat.totalVotes > 0 ? ((maxVotes / cat.totalVotes) * 100).toFixed(1) : '0.0');

    return {
      winners,
      isTie: winners.length > 1,
      isManualAward: false,
      winningPercentage,
      maxVotes
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reveal-summary-container">
      {/* Header */}
      <header className="reveal-menu-header" style={{ marginBottom: '16px' }}>
        <div className="reveal-menu-eyebrow">{eventInfo.faculty}</div>
        <h1 className="reveal-menu-title serif-display gold-gradient-text">
          Distinguished Award Winners
        </h1>

        <div className="ornamental-divider">
          <div className="line" />
          <div className="diamond">❖</div>
          <div className="line" />
        </div>

        <div className="reveal-menu-tagline">
          Official Roll of Honor • {eventInfo.name}
        </div>
      </header>

      {/* Winners Grid */}
      <main className="reveal-summary-grid">
        {categories.map((cat, idx) => {
          const { winners, isTie, isManualAward, winningPercentage, citation } = getCategoryWinners(cat);
          const hasWinner = winners.length > 0;

          return (
            <div
              key={cat.id}
              className={`reveal-summary-card ${hasWinner ? 'has-winner' : ''}`}
            >
              <div>
                <div className="reveal-summary-cat-title">
                  {isManualAward ? '★ Special Recognition Award' : `Category ${idx + 1}: ${cat.name}`}
                </div>

                {hasWinner ? (
                  winners.map((w, wIdx) => (
                    <div key={w.id || wIdx} style={{ marginBottom: '8px' }}>
                      <div className="reveal-summary-winner-name">
                        {w.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--reveal-text-muted)', marginBottom: '4px' }}>
                        {w.citation || w.department || 'ARMTI Faculty'}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--reveal-text-dim)', fontStyle: 'italic', margin: '12px 0' }}>
                    No recorded votes
                  </div>
                )}
              </div>

              <div className="reveal-summary-stats">
                {hasWinner ? (
                  isManualAward ? (
                    <>
                      <Medal size={16} color="var(--reveal-gold-light)" />
                      <span>Executive Honors Selection</span>
                    </>
                  ) : (
                    <>
                      <Award size={16} color="var(--reveal-gold-light)" />
                      <span>
                        {isTie ? 'Tie: ' : ''}
                        {winningPercentage}%
                      </span>
                    </>
                  )
                ) : (
                  <span>No votes</span>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer Actions */}
      <footer className="reveal-menu-footer">
        <button
          type="button"
          className="reveal-btn-secondary"
          onClick={onBackToMenu}
        >
          <ChevronLeft size={16} /> Back to Categories (Esc)
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="reveal-btn-secondary"
            onClick={handlePrint}
            title="Print winners list"
          >
            <Printer size={16} /> Print Roll of Honor
          </button>
        </div>
      </footer>
    </div>
  );
}
