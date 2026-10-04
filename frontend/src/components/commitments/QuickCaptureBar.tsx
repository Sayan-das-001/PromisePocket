import React, { useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Loader2 } from 'lucide-react';
import { AudioRecorder } from '../../lib/speech';
import { api } from '../../lib/api';
import { CommitmentProposal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface QuickCaptureBarProps {
  onProposalsExtracted: (proposals: CommitmentProposal[]) => void;
}

export const QuickCaptureBar: React.FC<QuickCaptureBarProps> = ({
  onProposalsExtracted,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const { user } = useAuth();
  const { toast, error } = useToast();

  const handleStartRecording = async () => {
    try {
      const rec = new AudioRecorder();
      await rec.start();
      setRecorder(rec);
      setIsRecording(true);
      toast('Listening...', 'Speak your promise clearly', 'info');
    } catch (err: any) {
      error('Microphone error', err.message);
    }
  };

  const handleStopRecording = async () => {
    if (!recorder) return;
    setIsRecording(false);
    setIsExtracting(true);
    try {
      const audioBlob = await recorder.stop();
      toast('Transcribing voice note...', undefined, 'info');
      const res = await api.transcribeAudio(audioBlob);
      if (res.text) {
        setText(res.text);
        toast('Transcribed!', 'Review and press extract', 'success');
      }
    } catch (err: any) {
      error('Transcription failed', err.message);
    } finally {
      setIsExtracting(false);
      setRecorder(null);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isExtracting) return;

    setIsExtracting(true);
    try {
      const tz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const res = await api.extractCommitments(text.trim(), tz);
      if (res.proposals && res.proposals.length > 0) {
        onProposalsExtracted(res.proposals);
        setText('');
      } else {
        toast('No commitment detected', 'Try phrasing as "I will call Ma tomorrow at 7 PM"', 'info');
      }
    } catch (err: any) {
      error('Extraction failed', err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-3 sm:p-4 border border-[#F0E4DE] shadow-warm transition-all">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Sparkle icon */}
        <div className="w-10 h-10 rounded-2xl bg-[#FFE2D5] flex items-center justify-center text-[#FF986F] shrink-0">
          <Sparkles className="w-5 h-5 fill-[#FF986F]" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isRecording
              ? 'Recording voice note... (click mic to stop)'
              : "What's something you need to remember?"
          }
          disabled={isExtracting}
          className="flex-1 bg-transparent px-2 text-sm text-[#292526] placeholder-[#898487] focus:outline-none"
        />

        {/* Mic Button */}
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isExtracting}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            isRecording
              ? 'bg-[#E74C3C] text-white animate-pulse shadow-md'
              : 'text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40'
          }`}
          title={isRecording ? 'Stop recording' : 'Speak commitment (ElevenLabs Voice)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send / Extract Button */}
        <button
          type="submit"
          disabled={!text.trim() || isExtracting}
          className="w-10 h-10 rounded-full bg-[#FF986F] text-white flex items-center justify-center hover:bg-[#F28254] disabled:opacity-40 disabled:hover:bg-[#FF986F] transition-all shadow-warm-sm shrink-0 active:scale-95"
          title="Extract commitment with Gemma AI"
        >
          {isExtracting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
