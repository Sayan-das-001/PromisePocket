import React, { useState } from 'react';
import {
  Check,
  X,
  Edit2,
  Clock,
  Calendar,
  AlertTriangle,
  Bell,
  Sparkles,
} from 'lucide-react';
import { CommitmentProposal } from '../../types';
import { cn, getCategoryColor } from '../../lib/utils';

interface ProposalCardProps {
  proposal: CommitmentProposal;
  onAccept: (proposal: CommitmentProposal) => Promise<void>;
  onReject: (proposalId: string) => void;
  onEdit: (proposal: CommitmentProposal) => void;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onAccept,
  onReject,
  onEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAccepted = proposal.status === 'confirmed';
  const isRejected = proposal.status === 'rejected';

  const categoryStyle = getCategoryColor(proposal.category);

  const handleAccept = async () => {
    if (isSubmitting || isAccepted || isRejected) return;
    setIsSubmitting(true);
    try {
      await onAccept(proposal);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        'my-3 p-4 rounded-3xl bg-white border transition-all shadow-warm-sm',
        isAccepted
          ? 'border-[#C8E6C9] bg-[#FAFDF8]'
          : isRejected
          ? 'border-[#FFCDD2] bg-[#FFF8F8] opacity-60'
          : 'border-[#F0E4DE] hover:border-[#FF986F]/60'
      )}
    >
      {/* Header with Title and AI Sparkle */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FFE2D5] text-[#FF986F] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Proposed Promise
            </span>
            {proposal.person_name && (
              <span className="text-xs font-semibold text-[#898487]">
                For <strong className="text-[#292526]">{proposal.person_name}</strong>
              </span>
            )}
          </div>
          <h4 className="font-serif font-bold text-base text-[#292526] leading-tight">
            {proposal.title}
          </h4>
        </div>

        {/* Edit Button */}
        {!isAccepted && !isRejected && (
          <button
            onClick={() => onEdit(proposal)}
            className="w-8 h-8 rounded-full border border-[#F0E4DE] flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
            title="Edit proposal details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Date & Time details */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#898487] my-2">
        <div className="flex items-center gap-1 bg-[#FFF9F5] px-2.5 py-1 rounded-full border border-[#F0E4DE]">
          <Calendar className="w-3 h-3 text-[#FF986F]" />
          <span className="font-medium text-[#292526]">
            {proposal.proposed_date || 'Unspecified date'}
          </span>
        </div>

        {proposal.proposed_time && (
          <div className="flex items-center gap-1 bg-[#FFF9F5] px-2.5 py-1 rounded-full border border-[#F0E4DE]">
            <Clock className="w-3 h-3 text-[#FF986F]" />
            <span className="font-medium text-[#292526]">
              {proposal.proposed_time}
            </span>
          </div>
        )}

        {proposal.reminder_enabled && (
          <div className="flex items-center gap-1 text-[11px] text-[#27AE60] bg-[#EAF7ED] px-2.5 py-1 rounded-full">
            <Bell className="w-3 h-3" />
            <span>Reminder will be scheduled</span>
          </div>
        )}
      </div>

      {/* Ambiguity Alert if present */}
      {proposal.is_ambiguous && proposal.ambiguity_note && (
        <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-[#FFF6E5] border border-[#FFE0B2] text-xs text-[#D35400] mb-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Clarification needed: </span>
            <span>{proposal.ambiguity_note}</span>
          </div>
        </div>
      )}

      {/* Action Buttons: Reject vs Accept */}
      <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F8ECE5]">
        {isAccepted ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-[#27AE60] bg-[#EAF7ED] px-3.5 py-1.5 rounded-full">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            Saved to Promises
          </span>
        ) : isRejected ? (
          <span className="text-xs text-[#898487] italic">Discarded</span>
        ) : (
          <>
            <button
              onClick={() => onReject(proposal.proposal_id)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#898487] border border-[#F0E4DE] hover:bg-[#FFF7F2] hover:text-[#292526] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>

            <button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] active:scale-95 shadow-warm-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Accept Promise'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
