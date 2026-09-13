import React from 'react';
import { Play, X } from 'lucide-react';
import { ProductGroup } from '../types';

interface AllGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allGroups: ProductGroup[];
  activeGroupId?: string;
  onSeekAndPlay: (seconds: number) => void;
  onSelectGroup?: (group: ProductGroup) => void;
}

export default function AllGroupsModal({
  isOpen,
  onClose,
  allGroups,
  activeGroupId,
  onSeekAndPlay,
  onSelectGroup,
}: AllGroupsModalProps) {
  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleGroupSelect = (group: ProductGroup) => {
    if (onSelectGroup) {
      onSelectGroup(group);
    }
    onSeekAndPlay(group.timestampSeconds);
    onClose();
  };

  return (
    <div className="main-product-grid" onClick={(e) => e.stopPropagation()}>
      {/* Metro HUD Navigation Header */}
      <nav className="nav">
        <div className="video-player-nav">
          <button
            type="button"
            onClick={onClose}
            className="button-resume-grid button-base"
            title="Resume Video"
          >
            <div className="btn-disc">
              <Play size={20} fill="#ffffff" strokeWidth={0} />
            </div>
            <span className="btn-label">Resume</span>
          </button>

          <div className="title">
            All Shoppable Moments ({allGroups.length})
          </div>

          <button
            type="button"
            onClick={onClose}
            className="button-start-grid button-base"
            title="Close"
          >
            <div className="btn-disc">
              <X size={20} strokeWidth={2.5} color="#ffffff" />
            </div>
            <span className="btn-label">Close</span>
          </button>
        </div>
      </nav>

      {/* Panoramic All Product Groups Grid */}
      <div className="all-product-groups">
        <div className="product-groups-container">
          {allGroups.map((pg, idx) => {
            const thumb =
              pg.products[0]?.imageUrl ||
              pg.products[0]?.imageUrls?.[0] ||
              '/assets/images/shoppable-video-touch.svg';
            const isCurrent = pg.id === activeGroupId;
            const timeLabel = pg.endTimestampSeconds
              ? `${formatTime(pg.timestampSeconds)} - ${formatTime(pg.endTimestampSeconds)}`
              : formatTime(pg.timestampSeconds);

            return (
              <div
                key={pg.id || idx}
                className={`product-group-tile ${isCurrent ? 'active' : ''}`}
                onClick={() => handleGroupSelect(pg)}
                title={`Jump to ${pg.title || 'Moment'} at ${formatTime(pg.timestampSeconds)}`}
              >
                <img
                  src={thumb}
                  alt={pg.title || 'Product Group'}
                  className="product-group-thumbnail"
                />
                <span className="product-group-badge">{timeLabel}</span>
                <span className="product-group-title">
                  {pg.title || pg.name || `Moment ${idx + 1}`} ({pg.products?.length || 0})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
