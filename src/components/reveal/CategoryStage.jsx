import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronLeft, Grid, RotateCcw, Award, Sparkles, Medal } from 'lucide-react';

export default function CategoryStage({
  category,
  categoryIndex = 0,
  totalCategories = 1,
  eventInfo,
  onBackToMenu,
  onMarkRevealed,
  isAlreadyRevealed = false,
  onTriggerFlash,
  onTriggerConfetti
}) {
  // State Machine: 'ready' | 'counting' | 'ranking' | 'winner' | 'done'
  const [stageState, setStageState] = useState(isAlreadyRevealed ? 'done' : 'ready');
  const [displayedPercentages, setDisplayedPercentages] = useState({});
  const [barWidths, setBarWidths] = useState({});
  const [isDimmedNonWinners, setIsDimmedNonWinners] = useState(isAlreadyRevealed);
  const [isWinnerHighlighted, setIsWinnerHighlighted] = useState(isAlreadyRevealed);

  const chartContainerRef = useRef(null);
  const [viewportHeight, setViewportHeight] = useState(400);
  const timeoutsRef = useRef([]);
  const animFramesRef = useRef([]);

  const isManualAward = Boolean(category?.isManualAward || category?.awardType === 'MANUAL');

  // Clear all active timers/frames helper
  const clearAllTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
    animFramesRef.current.forEach((id) => cancelAnimationFrame(id));
    animFramesRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Measure chart container height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (chartContainerRef.current) {
        setViewportHeight(chartContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const rawNominees = category?.nominees || [];
  const totalVotes = category?.totalVotes || 0;

  // Compute highest vote count or max percentage
  const maxVotes = useMemo(() => {
    if (!rawNominees.length) return 0;
    return Math.max(...rawNominees.map((n) => Number(n.votes || 0)));
  }, [rawNominees]);

  const maxPct = useMemo(() => {
    if (!rawNominees.length) return 0;
    return Math.max(...rawNominees.map((n) => parseFloat(n.percentage || '0')));
  }, [rawNominees]);

  // Initial alphabetical order for Pre-Reveal state
  const initialAlphabeticalList = useMemo(() => {
    return [...rawNominees].sort((a, b) => a.name.localeCompare(b.name));
  }, [rawNominees]);

  // Ranked order for Post-Reveal state (highest percentage/votes first, ties alphabetized)
  const rankedList = useMemo(() => {
    return [...rawNominees].sort((a, b) => {
      const pctB = parseFloat(b.percentage || '0');
      const pctA = parseFloat(a.percentage || '0');
      if (pctB !== pctA) {
        return pctB - pctA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [rawNominees]);

  // Determine winners
  const winners = useMemo(() => {
    if (isManualAward) return rawNominees;
    if (maxVotes <= 0 && maxPct <= 0) return [];
    return rawNominees.filter((n) => n.isWinner || (maxVotes > 0 && Number(n.votes) === maxVotes));
  }, [rawNominees, maxVotes, maxPct, isManualAward]);

  // Create lookup maps for nominee positions in both layouts
  const alphaIndexMap = useMemo(() => {
    const map = {};
    initialAlphabeticalList.forEach((nom, idx) => {
      map[nom.id] = idx;
    });
    return map;
  }, [initialAlphabeticalList]);

  const rankIndexMap = useMemo(() => {
    const map = {};
    rankedList.forEach((nom, idx) => {
      map[nom.id] = idx;
    });
    return map;
  }, [rankedList]);

  // Determine row height dynamically based on nominee count and container height
  const rowCount = Math.max(1, rawNominees.length);
  const calculatedHeight = Math.floor((viewportHeight - 8) / rowCount);
  const rowHeight = rowCount <= 4
    ? Math.max(82, Math.min(116, calculatedHeight))
    : rowCount <= 7
      ? Math.max(62, Math.min(82, calculatedHeight))
      : Math.max(48, Math.min(62, calculatedHeight));

  const nomineeSizeClass = rowCount <= 4 ? 'size-lg' : rowCount <= 7 ? 'size-md' : 'size-compact';

  // If already revealed initially, set instant state
  useEffect(() => {
    if (isAlreadyRevealed) {
      const fullWidths = {};
      const fullPcts = {};
      rawNominees.forEach((nom) => {
        const pctNum = parseFloat(nom.percentage || '0');
        const relWidth = maxPct > 0 ? (pctNum / maxPct) * 100 : (pctNum || 0);
        fullWidths[nom.id] = isManualAward ? 100 : relWidth;
        fullPcts[nom.id] = pctNum.toFixed(1);
      });
      setBarWidths(fullWidths);
      setDisplayedPercentages(fullPcts);
      setStageState('done');
      setIsWinnerHighlighted(true);
      setIsDimmedNonWinners(true);
    }
  }, [isAlreadyRevealed, rawNominees, maxPct, isManualAward]);

  // -------------------------------------------------------------
  // Smooth Percentage Counter Animation
  // -------------------------------------------------------------
  const animatePercentageCounter = useCallback((nomineeId, targetPct, durationMs) => {
    if (targetPct <= 0) {
      setDisplayedPercentages((prev) => ({ ...prev, [nomineeId]: '0.0' }));
      return;
    }
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = (targetPct * eased).toFixed(1);

      setDisplayedPercentages((prev) => ({ ...prev, [nomineeId]: currentVal }));

      if (progress < 1) {
        const frameId = requestAnimationFrame(step);
        animFramesRef.current.push(frameId);
      }
    };

    const frameId = requestAnimationFrame(step);
    animFramesRef.current.push(frameId);
  }, []);

  // -------------------------------------------------------------
  // Reveal Execution Sequence
  // -------------------------------------------------------------
  const startRevealSequence = useCallback(() => {
    if (stageState !== 'ready') return;
    clearAllTimers();

    if (rawNominees.length === 0 || (!isManualAward && totalVotes === 0)) {
      setStageState('done');
      onMarkRevealed(category.id);
      return;
    }

    setStageState('counting');

    // 1. Sort nominees from lowest percentage to highest for dramatic staggered reveal
    const ascendingNominees = [...rawNominees].sort((a, b) => parseFloat(a.percentage || '0') - parseFloat(b.percentage || '0'));
    const nomineeCount = ascendingNominees.length;
    const barGrowthDuration = 1400; // ms
    const staggerPerNominee = Math.min(450, Math.floor(3600 / Math.max(1, nomineeCount)));

    ascendingNominees.forEach((nom, index) => {
      const delay = index * staggerPerNominee;
      const timer = setTimeout(() => {
        const pctNum = parseFloat(nom.percentage || '0');
        const relWidth = maxPct > 0 ? (pctNum / maxPct) * 100 : (pctNum || 0);
        setBarWidths((prev) => ({ ...prev, [nom.id]: isManualAward ? 100 : relWidth }));
        if (!isManualAward) {
          animatePercentageCounter(nom.id, pctNum, barGrowthDuration);
        }
      }, delay);
      timeoutsRef.current.push(timer);
    });

    const totalGrowthTime = (nomineeCount - 1) * staggerPerNominee + barGrowthDuration;

    // 2. Ranking Phase
    const rankTimer = setTimeout(() => {
      setStageState('ranking');
    }, totalGrowthTime + 400);
    timeoutsRef.current.push(rankTimer);

    // 3. Winner Moment Phase
    const winnerTimer = setTimeout(() => {
      setStageState('winner');
      setIsWinnerHighlighted(true);
      setIsDimmedNonWinners(true);

      // Trigger Confetti and Golden Flash
      if (onTriggerFlash) onTriggerFlash();
      if (onTriggerConfetti) onTriggerConfetti();

      // Final done state
      const doneTimer = setTimeout(() => {
        setStageState('done');
        onMarkRevealed(category.id);
      }, 1400);
      timeoutsRef.current.push(doneTimer);
    }, totalGrowthTime + 400 + 1100 + 300);
    timeoutsRef.current.push(winnerTimer);
  }, [
    stageState,
    rawNominees,
    totalVotes,
    maxPct,
    isManualAward,
    category?.id,
    onMarkRevealed,
    onTriggerFlash,
    onTriggerConfetti,
    animatePercentageCounter,
    clearAllTimers
  ]);

  // -------------------------------------------------------------
  // Replay Phase
  // -------------------------------------------------------------
  const handleReplay = useCallback(() => {
    if (stageState === 'counting' || stageState === 'ranking' || stageState === 'winner') {
      return; // Ignore while animating
    }
    clearAllTimers();
    setStageState('ready');
    setDisplayedPercentages({});
    setBarWidths({});
    setIsDimmedNonWinners(false);
    setIsWinnerHighlighted(false);
  }, [stageState, clearAllTimers]);

  // -------------------------------------------------------------
  // Keyboard Handler for Presentation Remote & Shortcuts
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (stageState === 'ready') {
          startRevealSequence();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handleReplay();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        clearAllTimers();
        onBackToMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stageState, startRevealSequence, handleReplay, onBackToMenu, clearAllTimers]);

  // Compute status line text based on current animation state
  const getStatusText = () => {
    if (!isManualAward && totalVotes === 0 && stageState !== 'ready') {
      return 'No votes recorded for this category';
    }
    switch (stageState) {
      case 'ready':
        return isManualAward ? 'Special Recognition Honoree' : 'The nominees';
      case 'counting':
        return isManualAward ? 'Conferring Institutional Honors' : 'Counting the votes';
      case 'ranking':
        return 'The final ranking';
      case 'winner':
      case 'done':
        if (isManualAward) {
          if (winners.length === 1) {
            return `Honors Conferred: ${winners[0].name}`;
          }
          return `Special Honors: ${winners.map((w) => w.name).join(' & ')}`;
        }
        if (winners.length === 0) {
          return 'No votes recorded';
        }
        if (winners.length === 1) {
          return `The winner is ${winners[0].name} (${winners[0].percentage}%)`;
        }
        if (winners.length === 2) {
          return `Joint winners ${winners[0].name} & ${winners[1].name} (${winners[0].percentage}%)`;
        }
        return `Joint winners (${winners.length} Tied at ${winners[0].percentage}%)`;
      default:
        return 'The nominees';
    }
  };

  return (
    <div className="reveal-stage-container">
      {/* Stage Header */}
      <div className="reveal-stage-header">
        <div className="reveal-stage-eyebrow">
          {isManualAward ? '★ Special Recognition Award' : `Category ${categoryIndex + 1} of ${totalCategories}`}
        </div>

        <h1 className="reveal-stage-category-title serif-display gold-gradient-text">
          {category.name}
        </h1>

        <div className="ornamental-divider">
          <div className="line" />
          <div className="diamond">❖</div>
          <div className="line" />
        </div>

        <div className="reveal-stage-status">
          {(stageState === 'winner' || stageState === 'done') && winners.length > 0 && (
            <Award size={26} color="var(--reveal-gold-light)" />
          )}
          <span>{getStatusText()}</span>
        </div>
        {category.citation && (
          <div style={{ fontSize: 'clamp(0.85rem, 1.1vw, 1.1rem)', fontStyle: 'italic', color: 'var(--reveal-text-muted)', marginTop: '2px' }}>
            "{category.citation}"
          </div>
        )}
      </div>

      {/* Chart Viewport */}
      <div
        ref={chartContainerRef}
        className="reveal-chart-viewport"
        onClick={() => {
          if (stageState === 'ready') {
            startRevealSequence();
          }
        }}
        role="region"
        aria-label="Nominee chart and percentage reveal"
      >
        {rawNominees.map((nom) => {
          // In 'ready' or 'counting', position is alphabetical; in 'ranking', 'winner', 'done', position is rank order
          const isRankedPosition = stageState === 'ranking' || stageState === 'winner' || stageState === 'done';
          const targetIndex = isRankedPosition ? rankIndexMap[nom.id] : alphaIndexMap[nom.id];
          const topPx = targetIndex * rowHeight;

          const isNomineeWinner = isWinnerHighlighted && winners.some((w) => w.id === nom.id);
          const isDimmed = isDimmedNonWinners && !isNomineeWinner;
          const currentWidth = barWidths[nom.id] || 0;
          const hasPctShown = !isManualAward && displayedPercentages[nom.id] !== undefined;

          return (
            <div
              key={nom.id}
              className={`reveal-chart-row ${nomineeSizeClass} ${isNomineeWinner ? 'is-winner' : ''} ${isDimmed ? 'dimmed' : ''}`}
              style={{
                top: 0,
                height: `${rowHeight}px`,
                transform: `translate3d(0, ${topPx}px, 0)`
              }}
            >
              <div className="reveal-row-inner">
                {/* Horizontal Fill Bar */}
                <div
                  className="reveal-bar-fill"
                  style={{
                    width: `${currentWidth}%`
                  }}
                />

                {/* Content Overlay */}
                <div className="reveal-row-content">
                  <div className="reveal-nominee-info">
                    <span className="reveal-nominee-name">{nom.name}</span>
                    <span className="reveal-nominee-dept">
                      {nom.citation || nom.department || 'ARMTI Faculty'}
                    </span>
                  </div>

                  {hasPctShown && (
                    <div className="reveal-nominee-votes">
                      <span className="reveal-vote-count">
                        {displayedPercentages[nom.id]}%
                      </span>
                    </div>
                  )}

                  {isManualAward && isNomineeWinner && (
                    <div className="reveal-nominee-votes">
                      <span className="reveal-honoree-badge">
                        Honoree
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Controls & Hints */}
      <footer className="reveal-stage-footer">
        <div>
          {stageState === 'ready' && (
            <div className="reveal-hint-text">
              <span>Click chart or press <strong>Space / Enter / Right Arrow</strong> to reveal</span>
            </div>
          )}
          {(stageState === 'winner' || stageState === 'done') && (
            <button
              type="button"
              className="reveal-btn-secondary"
              onClick={handleReplay}
              title="Replay category reveal (Left Arrow)"
            >
              <RotateCcw size={14} /> Replay Category (Left Arrow)
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="reveal-btn-secondary"
            onClick={() => {
              clearAllTimers();
              onBackToMenu();
            }}
          >
            <ChevronLeft size={16} /> Back to Categories
          </button>
        </div>
      </footer>
    </div>
  );
}
