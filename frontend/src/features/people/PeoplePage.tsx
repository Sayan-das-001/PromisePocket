import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  User,
  Heart,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { Person } from '../../types';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { getPersonAvatarColor, getInitials } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const PeoplePage: React.FC = () => {
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const data = await api.getPeople();
      setPeople(data || []);
    } catch (err: any) {
      console.warn('Could not load people:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleOpenAdd = () => {
    setEditingPerson(null);
    setName('');
    setRelationship('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Person) => {
    setEditingPerson(p);
    setName(p.name);
    setRelationship(p.relationship || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingPerson) {
        await api.updatePerson(editingPerson.id, {
          name: name.trim(),
          relationship: relationship.trim() || undefined,
        });
        success('Person updated');
      } else {
        await api.createPerson(name.trim(), relationship.trim() || undefined);
        success('Person added to your circle');
      }
      setIsModalOpen(false);
      fetchPeople();
    } catch (err: any) {
      error('Failed to save person', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, personName: string) => {
    if (!confirm(`Are you sure you want to remove ${personName}? Existing promises will keep their name snapshot.`)) {
      return;
    }

    try {
      await api.deletePerson(id);
      success(`${personName} removed`);
      fetchPeople();
    } catch (err: any) {
      error('Failed to delete person', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#292526]">People I Care About</h2>
          <p className="text-xs text-[#898487]">Friends, family, and colleagues you make promises to</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] transition-all shadow-warm-sm"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Person</span>
        </button>
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {people.map((person) => (
          <div
            key={person.id}
            className="bg-white rounded-3xl p-5 border border-[#F0E4DE] shadow-warm-sm hover:shadow-warm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${getPersonAvatarColor(
                    person.name
                  )}`}
                >
                  {getInitials(person.name)}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(person)}
                    className="w-8 h-8 rounded-full border border-[#F0E4DE] flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFF7F2] transition-colors"
                    title="Edit person"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(person.id, person.name)}
                    className="w-8 h-8 rounded-full border border-[#F0E4DE] flex items-center justify-center text-[#898487] hover:text-[#E74C3C] hover:bg-[#FFF7F2] transition-colors"
                    title="Remove person"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-serif font-bold text-base text-[#292526]">{person.name}</h4>
              {person.relationship && (
                <span className="inline-block text-[11px] font-semibold text-[#FF986F] bg-[#FFE2D5]/50 px-2 py-0.5 rounded-full mt-1">
                  {person.relationship}
                </span>
              )}

              {/* Counts */}
              <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-[#F8ECE5] text-xs">
                <div className="flex items-center gap-1.5 text-[#898487]">
                  <Clock className="w-3.5 h-3.5 text-[#FF986F]" />
                  <span>
                    <strong className="text-[#292526]">{person.upcoming_count || 0}</strong> upcoming
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#898487]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#27AE60]" />
                  <span>
                    <strong className="text-[#292526]">{person.completed_count || 0}</strong> kept
                  </span>
                </div>
              </div>
            </div>

            {/* View Promises Button */}
            <button
              onClick={() => navigate(`/promises?person_id=${person.id}`)}
              className="w-full mt-2 py-2 rounded-2xl bg-[#FFF9F5] hover:bg-[#FFE2D5]/40 border border-[#F0E4DE] text-xs font-semibold text-[#292526] flex items-center justify-center gap-1 transition-colors"
            >
              <span>View Promises</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit Person Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-warm-lg border border-[#F0E4DE] relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full flex items-center justify-center text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-lg text-[#292526] mb-4">
              {editingPerson ? 'Edit Person' : 'Add Person I Care About'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mom, Rahul, Priya"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
                  Relationship (optional)
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Mother, Friend, Colleague"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#898487] hover:bg-[#FFF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] shadow-warm-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
