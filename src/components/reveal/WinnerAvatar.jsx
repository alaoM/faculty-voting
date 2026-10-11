import React from 'react';
import { Award, Trophy } from 'lucide-react';
import { getWinnerPhoto, getInitials } from './winnerImages';

export default function WinnerAvatar({
  name,
  size = 'md', // 'sm' | 'md' | 'lg' | 'hero'
  showBadge = false,
  badgeText = 'WINNER',
  className = ''
}) {
  const photoUrl = getWinnerPhoto(name);
  const initials = getInitials(name);

  return (
    <div className={`reveal-avatar-wrapper size-${size} ${className}`}>
      <div className="reveal-avatar-frame">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name || 'Award Winner'}
            className="reveal-avatar-img"
            loading="lazy"
            onError={(e) => {
              // Graceful fallback to no-image mode if file fails to load
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                const placeholder = parent.querySelector('.reveal-avatar-no-img');
                if (placeholder) placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}

        {/* Fallback "No Image Design" - Luxury Gold Monogram with Trophy Laurel */}
        <div
          className="reveal-avatar-no-img"
          style={{ display: photoUrl ? 'none' : 'flex' }}
        >
          <div className="no-img-backdrop" />
          <div className="no-img-content">
            <Trophy className="no-img-trophy" size={size === 'hero' ? 36 : size === 'lg' ? 26 : 18} />
            <span className="no-img-initials">{initials}</span>
          </div>
        </div>

        {showBadge && (
          <div className="reveal-avatar-badge">
            <Award size={12} className="badge-icon" />
            <span>{badgeText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
