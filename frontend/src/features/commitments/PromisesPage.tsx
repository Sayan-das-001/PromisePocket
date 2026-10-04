import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { Commitment, CommitmentCategory, CommitmentStatus, Person } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommitmentCard } from '../../components/commitments/CommitmentCard';
import { EditCommitmentModal } from '../../components/commitments/EditCommitmentModal';
import { useSearchParams } from 'react-router-dom';

export const PromisesPage: React.FC = () => {
  const { user } = useAuth();
  const { toast, success, error } = useToast();
  const [searchParams] = useSearchParams();

  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>(searchParams.get('person_id') || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_at' | 'created_at' | 'person'>('due_at');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comms, ppl] = await Promise.all([
        api.getCommitments(),
        api.getPeople(),
      ]);
      setCommitments(comms || []);
      setPeople(ppl || []);
    } catch (err: any) {
      console.warn('Could not load promises:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.completeCommitment(id);
      success('Promise kept!');
      fetchData();
    } catch (err: any) {
      error('Failed to complete promise', err.message);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await api.cancelCommitment(id);
      toast('Promise cancelled', undefined, 'info');
      fetchData();
    } catch (err: any) {
      error('Failed to cancel promise', err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteCommitment(id);
      toast('Commitment deleted', undefined, 'info');
      fetchData();
    } catch (err: any) {
      error('Failed to delete commitment', err.message);
    }
  };

  const handleSaveModal = async (formData: any) => {
    try {
      if (editingCommitment && editingCommitment.id) {
        await api.updateCommitment(editingCommitment.id, {
          title: formData.title,
          person_name_snapshot: formData.person_name,
          category: formData.category,
          due_at: formData.date ? `${formData.date}T${formData.time || '12:00'}:00` : undefined,
          reminder_enabled: formData.reminder_enabled,
        });
        success('Commitment updated');
      } else {
        await api.createCommitment({
          title: formData.title,
          person_name_snapshot: formData.person_name,
          category: formData.category,
          due_at: formData.date ? `${formData.date}T${formData.time || '12:00'}:00` : undefined,
          reminder_enabled: formData.reminder_enabled,
          status: 'pending',
          timezone: user?.timezone || 'Asia/Kolkata',
          source_type: 'typed_text',
        });
        success('New promise added');
      }
      fetchData();
    } catch (err: any) {
      error('Failed to save commitment', err.message);
    }
  };

  // Filter & Sort logic
  const filteredCommitments = commitments
    .filter((c) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesPerson = c.person_name_snapshot?.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPerson && !matchesDesc) return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending' && c.status !== 'pending') return false;
        if (statusFilter === 'completed' && c.status !== 'completed') return false;
        if (statusFilter === 'cancelled' && c.status !== 'cancelled') return false;
      }

      // Person
      if (personFilter !== 'all') {
        if (c.person_id !== personFilter && c.person_name_snapshot !== personFilter) return false;
      }

      // Category
      if (categoryFilter !== 'all') {
        if (c.category !== categoryFilter) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'due_at') {
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      }
      if (sortBy === 'created_at') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'person') {
        return (a.person_name_snapshot || '').localeCompare(b.person_name_snapshot || '');
      }
      return 0;
    });

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#292526]">All Promises</h2>
          <p className="text-xs text-[#898487]">Search, filter, and review all commitments you've made</p>
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
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] transition-all shadow-warm-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Promise</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#F0E4DE] shadow-warm-sm space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#898487] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promises by title, person (e.g. Rahul), or details..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-xs sm:text-sm text-[#292526] bg-[#FFF9F5]/40"
          />
        </div>

        {/* Filter Pills & Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-[#FFF9F5] p-1 rounded-2xl border border-[#F0E4DE]">
            {['all', 'pending', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-[#FF986F] text-white shadow-sm'
                    : 'text-[#898487] hover:text-[#292526]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Person Selector */}
          <select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="px-3 py-1.5 rounded-2xl border border-[#F0E4DE] bg-[#FFF9F5] text-xs font-medium text-[#292526] focus:outline-none"
          >
            <option value="all">All People</option>
            {people.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-2xl border border-[#F0E4DE] bg-[#FFF9F5] text-xs font-medium text-[#292526] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {['family', 'friendship', 'study', 'errands', 'health', 'work', 'other'].map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1 text-xs text-[#898487]">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold text-[#292526] focus:outline-none cursor-pointer"
            >
              <option value="due_at">Sort: Due Date</option>
              <option value="created_at">Sort: Recently Added</option>
              <option value="person">Sort: Person</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#898487] px-1">
        <span>Showing {filteredCommitments.length} commitments</span>
      </div>

      {/* Commitment Cards Grid */}
      {filteredCommitments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCommitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
              onEdit={(c) => {
                setEditingCommitment(c);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-10 border border-[#F0E4DE] text-center shadow-warm-sm">
          <p className="text-sm font-serif font-bold text-[#292526] mb-1">No promises matched your filters</p>
          <p className="text-xs text-[#898487] mb-4">Try clearing filters or search query.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setPersonFilter('all');
              setCategoryFilter('all');
            }}
            className="text-xs font-semibold text-[#FF986F] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

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
