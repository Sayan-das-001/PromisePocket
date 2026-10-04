import React, { useState } from 'react';
import {
  Clock,
  CheckCircle,
  MoreVertical,
  Calendar,
  Repeat,
  Bell,
  Trash2,
  XCircle,
  Edit3,
} from 'lucide-react';
import { Commitment } from '../../types';
import {
  cn,
  formatFullDue,
  formatLocalDate,
  formatTimeOrPeriod,
  getCategoryColor,
  getPersonAvatarColor,
  getInitials,
} from '../../lib/utils';

interface CommitmentCardProps {
  commitment: Commitment;
  onComplete: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (commitment: Commitment) => void;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({
  commitment,
  onComplete,
  onCancel,
  onDelete,
  onEdit,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const isCompleted = commitment.status === 'completed';
  const isCancelled = commitment.status === 'cancelled';
  const categoryStyle = getCategoryColor(commitment.category);
  const personName = commitment.person_name_snapshot || 'Personal';

  const handleCompleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    setIsCompleting(true);
    try {
      await onComplete(commitment.id);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-white rounded-3xl p-5 border transition-all duration-300 shadow-warm-sm hover:shadow-warm',
        isCompleted
          ? 'border-[#E8F5E9] bg-white/70 opacity-80'
          : isCancelled
          ? 'border-[#FFEBEE] bg-white/60 opacity-60'
          : 'border-[#F0E4DE] hover:border-[#FF986F]/60'
      )}
    >
      {/* Top Row: Person Tag & Actions Menu */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm',
              getPersonAvatarColor(personName)
            )}
          >
            {getInitials(personName)}
          </div>
          <span className="font-semibold text-xs sm:text-sm text-[#292526]">
            {personName}
          </span>
          <span
            className={cn(
              'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border',
              categoryStyle.bg,
              categoryStyle.text,
              categoryStyle.border
            )}
          >
            {commitment.category}
          </span>
        </div>

        {/* Options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-9 z-20 w-44 bg-white rounded-2xl shadow-warm border border-[#F0E4DE] py-1.5 animate-in fade-in"
              onClick={() => setShowMenu(false)}
            >
              {onEdit && (
                <button
                  onClick={() => onEdit(commitment)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#292526] hover:bg-[#FFF7F2] font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FF986F]" />
                  Edit Details
                </button>
              )}
              {onCancel && !isCompleted && !isCancelled && (
                <button
                  onClick={() => onCancel(commitment.id)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#E67E22] hover:bg-[#FFF7F2] font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Cancel Promise
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(commitment.id)}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#E74C3C] hover:bg-[#FFF7F2] font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Commitment Title */}
      <h3
        className={cn(
          'font-serif text-base sm:text-lg font-bold text-[#292526] mb-2 leading-snug',
          isCompleted && 'line-through text-[#898487]'
        )}
      >
        {commitment.title}
      </h3>

      {/* Description if present */}
      {commitment.description && (
        <p className="text-xs text-[#898487] mb-3 line-clamp-2">
          {commitment.description}
        </p>
      )}

      {/* Metadata Badges (Due Date, Time, Recurrence, Reminder) */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#898487] mt-3 pt-3 border-t border-[#F8ECE5]">
        {/* Date & Time */}
        <div className="flex items-center gap-1.5 bg-[#FFF9F5] px-2.5 py-1 rounded-full border border-[#F0E4DE]">
          <Clock className="w-3.5 h-3.5 text-[#FF986F]" />
          <span className="font-medium text-[#292526]">
            {formatLocalDate(commitment.due_at)}
            {commitment.due_at && (
              <span className="text-[#898487] ml-1">
                {formatTimeOrPeriod(commitment.due_at, commitment.date_precision)}
              </span>
            )}
          </span>
        </div>

        {/* Recurrence Rule */}
        {commitment.recurrence_rule && (
          <div className="flex items-center gap-1 bg-[#F2E8FA] px-2.5 py-1 rounded-full text-[#8E44AD] font-medium">
            <Repeat className="w-3 h-3" />
            <span>Recurring</span>
          </div>
        )}

        {/* Reminder Indicator */}
        {commitment.reminder_enabled && (
          <div className="flex items-center gap-1 text-[11px] text-[#27AE60] bg-[#EAF7ED] px-2 py-0.5 rounded-full">
            <Bell className="w-3 h-3" />
            <span>Reminder active</span>
          </div>
        )}

        {/* Complete Action Button */}
        <div className="ml-auto flex items-center">
          <button
            onClick={handleCompleteClick}
            disabled={isCompleted || isCompleting}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm',
              isCompleted
                ? 'bg-[#EAF7ED] text-[#27AE60] cursor-default'
                : 'bg-[#FFE2D5] text-[#292526] hover:bg-[#FF986F] hover:text-white active:scale-95'
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isCompleted ? 'Kept' : isCompleting ? 'Keeping...' : 'Keep Promise'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
