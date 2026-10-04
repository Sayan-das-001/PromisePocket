import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Commitment, CommitmentProposal, DashboardSummary, Person } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommitmentCard } from '../../components/commitments/CommitmentCard';
import { ProposalCard } from '../../components/commitments/ProposalCard';
import { QuickCaptureBar } from '../../components/commitments/QuickCaptureBar';
import { EditCommitmentModal } from '../../components/commitments/EditCommitmentModal';
import { getPersonAvatarColor, getInitials } from '../../lib/utils';
import { addDays, format, isSameDay } from 'date-fns';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDateIndex, setActiveDateIndex] = useState(0); // 0 is today

  // Extracted proposals awaiting confirmation
  const [pendingProposals, setPendingProposals] = useState<CommitmentProposal[]>([]);

  // Editing state
  const [editingCommitment, setEditingCommitment] = useState<Commitment | CommitmentProposal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.warn('Could not fetch dashboard summary:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Generate 7-day strip centered on today
  const today = new Date();
  const dateStrip = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Proposal confirmation actions
  const handleAcceptProposal = async (proposal: CommitmentProposal) => {
    try {
      const res = await api.confirmProposal(proposal);
      success('Promise saved!', `Scheduled reminder status: ${res.reminder_status}`);
      // Mark as confirmed in UI
      setPendingProposals((prev) =>
        prev.map((p) =>
          p.proposal_id === proposal.proposal_id ? { ...p, status: 'confirmed' } : p
        )
      );
      // Refresh dashboard summary
      fetchDashboardData();
    } catch (err: any) {
      error('Failed to confirm promise', err.message);
    }
  };

  const handleRejectProposal = (proposalId: string) => {
    setPendingProposals((prev) =>
      prev.map((p) => (p.proposal_id === proposalId ? { ...p, status: 'rejected' } : p))
    );
    toast('Proposal discarded', undefined, 'info');
  };

  const handleEditProposalOrCommitment = (item: Commitment | CommitmentProposal) => {
    setEditingCommitment(item);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (formData: any) => {
    if (!editingCommitment) return;

    if ('proposal_id' in editingCommitment) {
      // It's a proposal
      const prop = editingCommitment as CommitmentProposal;
      const updated: CommitmentProposal = {
        ...prop,
        title: formData.title,
        person_name: formData.person_name,
        proposed_date: formData.date,
        proposed_time: formData.time,
        category: formData.category,
        reminder_enabled: formData.reminder_enabled,
        is_ambiguous: false,
        ambiguity_note: undefined,
      };
      setPendingProposals((prev) =>
        prev.map((p) => (p.proposal_id === prop.proposal_id ? updated : p))
      );
      success('Proposal updated', 'You can now accept it');
    } else {
      // It's an existing commitment
      const com = editingCommitment as Commitment;
      try {
        await api.updateCommitment(com.id, {
          title: formData.title,
          person_name_snapshot: formData.person_name,
          category: formData.category,
          due_at: formData.date ? `${formData.date}T${formData.time || '12:00'}:00` : undefined,
          reminder_enabled: formData.reminder_enabled,
        });
        success('Commitment updated');
        fetchDashboardData();
      } catch (err: any) {
        error('Failed to update commitment', err.message);
      }
    }
  };

  const handleCompleteCommitment = async (id: string) => {
    try {
      await api.completeCommitment(id);
      success('Promise kept!', 'Great job following through');
      fetchDashboardData();
    } catch (err: any) {
      error('Failed to complete promise', err.message);
    }
  };

  const handleCancelCommitment = async (id: string) => {
    try {
      await api.cancelCommitment(id);
      toast('Promise cancelled', undefined, 'info');
      fetchDashboardData();
    } catch (err: any) {
      error('Failed to cancel promise', err.message);
    }
  };

  const handleDeleteCommitment = async (id: string) => {
    try {
      await api.deleteCommitment(id);
      toast('Commitment deleted', undefined, 'info');
      fetchDashboardData();
    } catch (err: any) {
      error('Failed to delete commitment', err.message);
    }
  };

  // Filter today's promises based on active date in strip
  const selectedDate = dateStrip[activeDateIndex];
  const displayedPromises = (summary?.todays_promises || []).filter((c) => {
    if (!c.due_at) return activeDateIndex === 0;
    try {
      return isSameDay(new Date(c.due_at), selectedDate);
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 7-Day Date Selector Strip inspired by Reference Screen 1 */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-2 no-scrollbar">
        {dateStrip.map((d, idx) => {
          const isSelected = idx === activeDateIndex;
          const dayName = format(d, 'EEE').slice(0, 2);
          const dayNumber = format(d, 'd');

          return (
            <button
              key={idx}
              onClick={() => setActiveDateIndex(idx)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-2.5 px-2 rounded-2xl transition-all duration-200 ${
                isSelected
                  ? 'bg-white shadow-warm border-2 border-[#FF986F] text-[#292526] scale-105'
                  : 'bg-transparent text-[#898487] hover:bg-white/50'
              }`}
            >
              <span className="text-[11px] font-medium tracking-tight mb-0.5">{dayName}</span>
              <span className={`text-base font-bold ${isSelected ? 'text-[#FF986F]' : 'text-[#292526]'}`}>
                {dayNumber}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Capture Input */}
      <div>
        <QuickCaptureBar
          onProposalsExtracted={(proposals) => {
            setPendingProposals(proposals);
            toast('AI Extracted Proposals', 'Please review and accept your promises', 'info');
          }}
        />
      </div>

      {/* Pending Proposals Review Section */}
      {pendingProposals.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFF0E8] border border-[#FFC8B3] animate-in slide-in-from-top-4 shadow-warm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FF986F]" />
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#292526]">
                Review Proposed Commitments ({pendingProposals.filter((p) => p.status === 'draft').length} pending)
              </h3>
            </div>
            {pendingProposals.some((p) => p.status === 'draft' && !p.is_ambiguous) && (
              <button
                onClick={async () => {
                  const drafts = pendingProposals.filter((p) => p.status === 'draft' && !p.is_ambiguous);
                  for (const p of drafts) {
                    await handleAcceptProposal(p);
                  }
                }}
                className="text-xs font-bold text-white bg-[#FF986F] px-3.5 py-1.5 rounded-full hover:bg-[#F28254] transition-colors shadow-sm"
              >
                Accept All Clear
              </button>
            )}
          </div>
          <p className="text-xs text-[#898487] mb-3">
            Gemma AI extracted these promises. Review or edit them before they are scheduled.
          </p>

          <div className="space-y-3">
            {pendingProposals.map((proposal) => (
              <ProposalCard
                key={proposal.proposal_id}
                proposal={proposal}
                onAccept={handleAcceptProposal}
                onReject={handleRejectProposal}
                onEdit={handleEditProposalOrCommitment}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Insight Card */}
      {summary?.ai_insight && (
        <div className="flex items-center gap-3.5 p-4 rounded-3xl bg-white border border-[#F0E4DE] shadow-warm-sm">
          <div className="w-10 h-10 rounded-2xl ai-gradient-badge flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF986F]">
              Assistant Insight
            </span>
            <p className="text-xs sm:text-sm font-medium text-[#292526] leading-snug">
              {summary.ai_insight}
            </p>
          </div>
        </div>
      )}

      {/* Main Section Header: Today's Promises + Add Promise */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#292526]">
            {activeDateIndex === 0 ? "Today's Promises" : `Promises for ${format(selectedDate, 'MMMM d')}`}
          </h2>
          <p className="text-xs text-[#898487]">
            {displayedPromises.length} {displayedPromises.length === 1 ? 'commitment' : 'commitments'} scheduled
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCommitment({
              id: '',
              user_id: user?.id || '',
              title: '',
              category: 'family',
              status: 'pending',
              timezone: user?.timezone || 'Asia/Kolkata',
              date_precision: 'exact_time',
              reminder_enabled: true,
              source_type: 'typed_text',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#FFE2D5] text-[#292526] hover:bg-[#FF986F] hover:text-white transition-all shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Promise</span>
        </button>
      </div>

      {/* Commitment Cards Grid */}
      {displayedPromises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedPromises.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onComplete={handleCompleteCommitment}
              onCancel={handleCancelCommitment}
              onDelete={handleDeleteCommitment}
              onEdit={handleEditProposalOrCommitment}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-[#F0E4DE] text-center shadow-warm-sm">
          <div className="w-14 h-14 rounded-full bg-[#FFE2D5] text-[#FF986F] flex items-center justify-center mx-auto mb-3">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <h4 className="font-serif font-bold text-base text-[#292526] mb-1">
            No promises scheduled for this day
          </h4>
          <p className="text-xs text-[#898487] max-w-sm mx-auto mb-4">
            Use the capture bar above or say "I will call Ma tomorrow at 7 PM" to add one.
          </p>
        </div>
      )}

      {/* People I Care About Carousel/Grid */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FF986F]" />
            <h3 className="font-serif font-bold text-lg text-[#292526]">
              People I Care About
            </h3>
          </div>
          <button
            onClick={() => navigate('/people')}
            className="flex items-center gap-1 text-xs font-semibold text-[#FF986F] hover:text-[#F28254]"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(summary?.people || []).slice(0, 4).map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/promises?person_id=${p.id}`)}
              className="bg-white rounded-2xl p-3.5 border border-[#F0E4DE] hover:border-[#FF986F]/60 shadow-warm-sm transition-all cursor-pointer flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${getPersonAvatarColor(
                  p.name
                )}`}
              >
                {getInitials(p.name)}
              </div>
              <div className="truncate">
                <h5 className="font-semibold text-xs text-[#292526] truncate">{p.name}</h5>
                <p className="text-[11px] text-[#898487] truncate">
                  {p.upcoming_count || 0} upcoming
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Commitment Modal */}
      <EditCommitmentModal
        isOpen={isModalOpen}
        commitment={editingCommitment}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCommitment(null);
        }}
        onSave={handleSaveModal}
      />
    </div>
  );
};
