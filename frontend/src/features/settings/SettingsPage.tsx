import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Clock,
  Database,
  Mic,
  Shield,
  RotateCcw,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { IntegrationHealth } from '../../types';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { toast, success, error } = useToast();

  const [displayName, setDisplayName] = useState(user?.display_name || 'Sarah');
  const [timezone, setTimezone] = useState(
    user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
  );
  const [leadMinutes, setLeadMinutes] = useState(user?.preferred_reminder_lead_minutes || 30);
  const [defaultTime, setDefaultTime] = useState(user?.default_reminder_time || '09:00');
  const [aiProvider, setAiProvider] = useState<'ollama' | 'remote' | 'demo'>(
    user?.ai_provider || 'ollama'
  );

  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateSettings({
        display_name: displayName,
        timezone,
        preferred_reminder_lead_minutes: Number(leadMinutes),
        default_reminder_time: defaultTime,
        ai_provider: aiProvider,
      });
      await refreshUser();
      success('Settings saved successfully');
    } catch (err: any) {
      error('Failed to update settings', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm('Reset to initial demo commitments and people? Current records will be replaced.')) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await api.resetDemoData();
      success('Demo data restored', res.message);
    } catch (err: any) {
      error('Failed to reset demo data', err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const commitments = await api.getCommitments();
      const people = await api.getPeople();
      const exportBlob = new Blob(
        [
          JSON.stringify(
            {
              export_date: new Date().toISOString(),
              user,
              commitments,
              people,
            },
            null,
            2
          ),
        ],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(exportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promisepocket_export_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Data exported successfully');
    } catch (err: any) {
      error('Failed to export data', err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-serif font-bold text-2xl text-[#292526]">Settings & Privacy</h2>
        <p className="text-xs text-[#898487]">Customize preferences, reminders, AI engine, and data privacy</p>
      </div>

      {/* Profile & Preferences Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 border border-[#F0E4DE] shadow-warm space-y-4">
        <h3 className="font-serif font-bold text-base text-[#292526] border-b border-[#F8ECE5] pb-2">
          Personal Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              Timezone (IANA)
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              Reminder Lead Time
            </label>
            <select
              value={leadMinutes}
              onChange={(e) => setLeadMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/40"
            >
              <option value={0}>At exact due time</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before (Default)</option>
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#898487] uppercase tracking-wider mb-1">
              Default Day Reminder Time
            </label>
            <input
              type="time"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
              className="w-full px-4 py-2 rounded-2xl border border-[#F0E4DE] focus:border-[#FF986F] focus:outline-none text-sm text-[#292526] bg-[#FFF9F5]/40"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FF986F] text-white hover:bg-[#F28254] transition-all shadow-warm-sm"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      {/* AI & Infrastructure Engine Diagnostics */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0E4DE] shadow-warm space-y-4">
        <h3 className="font-serif font-bold text-base text-[#292526] border-b border-[#F8ECE5] pb-2">
          Sponsor Technologies & Integrations
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Gemma */}
          <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#292526] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#FF986F]" />
                Gemma Open-Weight AI
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  health?.ollama_connected
                    ? 'bg-[#EAF7ED] text-[#27AE60]'
                    : 'bg-[#FFF6E5] text-[#D35400]'
                }`}
              >
                {health?.ollama_connected ? 'Connected' : 'Mock/Demo Active'}
              </span>
            </div>
            <p className="text-[#898487]">
              Provider: Ollama / Gemma 2B-IT / 7B-IT. Extracts commitments and reasons with strict privacy.
            </p>
          </div>

          {/* Temporal */}
          <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#292526] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#3498DB]" />
                Temporal Workflows
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  health?.temporal_connected
                    ? 'bg-[#EAF7ED] text-[#27AE60]'
                    : 'bg-[#FFF6E5] text-[#D35400]'
                }`}
              >
                {health?.temporal_connected ? 'Durable Worker Ready' : 'Dev Scheduler Ready'}
              </span>
            </div>
            <p className="text-[#898487]">
              Durable timers survive server restarts and handle retries, cancellations, and notifications.
            </p>
          </div>

          {/* MongoDB Atlas */}
          <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#292526] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#27AE60]" />
                MongoDB Atlas
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  health?.mongodb_connected
                    ? 'bg-[#EAF7ED] text-[#27AE60]'
                    : 'bg-[#E8F4F8] text-[#2980B9]'
                }`}
              >
                {health?.mongodb_connected ? 'Atlas Persistent' : 'Development Store'}
              </span>
            </div>
            <p className="text-[#898487]">
              Indexed document memory with strict user-level multi-tenant isolation.
            </p>
          </div>

          {/* ElevenLabs */}
          <div className="p-3.5 rounded-2xl bg-[#FFF9F5] border border-[#F0E4DE] space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#292526] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-[#9B59B6]" />
                ElevenLabs Voice
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  health?.elevenlabs_configured
                    ? 'bg-[#EAF7ED] text-[#27AE60]'
                    : 'bg-[#FFF6E5] text-[#D35400]'
                }`}
              >
                {health?.elevenlabs_configured ? 'Active' : 'Web Speech Fallback'}
              </span>
            </div>
            <p className="text-[#898487]">
              High-accuracy speech-to-text and natural voice output for assistant notes.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & Privacy */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0E4DE] shadow-warm space-y-4">
        <h3 className="font-serif font-bold text-base text-[#292526] border-b border-[#F8ECE5] pb-2">
          Data Management & Privacy
        </h3>

        <div className="p-3.5 rounded-2xl bg-[#EAF7ED] border border-[#C8E6C9] flex items-start gap-3 text-xs text-[#27AE60]">
          <Shield className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[#292526]">
            <strong>Privacy Pledge:</strong> When local Gemma AI is active, your commitments never leave your machine. No conversations are sold or transmitted to third parties without authorization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#FFF9F5] border border-[#F0E4DE] text-[#292526] hover:bg-[#FFE2D5]/40 transition-colors"
          >
            <Download className="w-4 h-4 text-[#FF986F]" />
            <span>Export Personal Data (.json)</span>
          </button>

          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#FFF9F5] border border-[#F0E4DE] text-[#D35400] hover:bg-[#FFF6E5] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
