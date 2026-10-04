import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  Paperclip,
  Check,
  X,
  Edit2,
  RotateCcw,
  Loader2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, CommitmentProposal } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AudioRecorder, BrowserSpeechRecognizer, speakText, stopSpeaking } from '../../lib/speech';
import { ProposalCard } from '../../components/commitments/ProposalCard';
import { EditCommitmentModal } from '../../components/commitments/EditCommitmentModal';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const AssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { toast, success, error } = useToast();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<AudioRecorder | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Proposal editing modal state
  const [editingProposal, setEditingProposal] = useState<CommitmentProposal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting
  useEffect(() => {
    const initialWelcome: ChatMessage = {
      id: 'welcome-msg',
      role: 'assistant',
      content:
        "Hi there! I'm your PromisePocket assistant powered by Gemma AI. Tell me what you promised to do (by typing or using the mic), or ask about promises you've made to friends and family.",
      timestamp: format(new Date(), 'h:mm a'),
    };
    setMessages([initialWelcome]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice recording handlers
  const handleStartRecording = async () => {
    const browserRec = new BrowserSpeechRecognizer();
    if (browserRec.isSupported) {
      try {
        setIsRecording(true);
        toast('Listening...', 'Speak your promise clearly', 'info');
        const recognizedText = await browserRec.listen();
        if (recognizedText) {
          setInputText(recognizedText);
          toast('Speech transcribed!', 'Review and press send', 'success');
        }
        setIsRecording(false);
        return;
      } catch (e: any) {
        setIsRecording(false);
        // Fallback to audio recorder if native recognition was interrupted
      }
    }

    try {
      const rec = new AudioRecorder();
      await rec.start();
      setRecorder(rec);
      setIsRecording(true);
      toast('Recording...', 'Speak your promise naturally', 'info');
    } catch (err: any) {
      error('Microphone error', err.message);
    }
  };

  const handleStopRecording = async () => {
    if (!recorder) return;
    setIsRecording(false);
    setIsSending(true);
    try {
      const audioBlob = await recorder.stop();
      toast('Transcribing audio with ElevenLabs...', undefined, 'info');
      const res = await api.transcribeAudio(audioBlob);
      if (res.text) {
        setInputText(res.text);
        toast('Voice transcribed!', 'You can edit or send now', 'success');
      }
    } catch (err: any) {
      error('Voice transcription failed', err.message);
    } finally {
      setIsSending(false);
      setRecorder(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: format(new Date(), 'h:mm a'),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const tz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const response = await api.sendAssistantMessage(text, tz);

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: response.reply,
        timestamp: format(new Date(), 'h:mm a'),
        proposals: response.proposals,
        citations: response.citations,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      error('Assistant error', err.message);
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: `I ran into an issue: ${err.message}. Your input has been saved. Please try again or check settings.`,
        timestamp: format(new Date(), 'h:mm a'),
        is_error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Proposal confirmation
  const handleAcceptProposal = async (proposal: CommitmentProposal) => {
    try {
      const res = await api.confirmProposal(proposal);
      success('Promise saved to your pocket!', `Reminder status: ${res.reminder_status}`);

      // Update proposal status in messages
      setMessages((prev) =>
        prev.map((msg) => {
          if (!msg.proposals) return msg;
          return {
            ...msg,
            proposals: msg.proposals.map((p) =>
              p.proposal_id === proposal.proposal_id ? { ...p, status: 'confirmed' } : p
            ),
          };
        })
      );
    } catch (err: any) {
      error('Failed to confirm proposal', err.message);
    }
  };

  const handleRejectProposal = (proposalId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.proposals) return msg;
        return {
          ...msg,
          proposals: msg.proposals.map((p) =>
            p.proposal_id === proposalId ? { ...p, status: 'rejected' } : p
          ),
        };
      })
    );
    toast('Proposal discarded', undefined, 'info');
  };

  const handleEditProposal = (proposal: CommitmentProposal) => {
    setEditingProposal(proposal);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedProposal = async (formData: any) => {
    if (!editingProposal) return;
    const updated: CommitmentProposal = {
      ...editingProposal,
      title: formData.title,
      person_name: formData.person_name,
      proposed_date: formData.date,
      proposed_time: formData.time,
      category: formData.category,
      reminder_enabled: formData.reminder_enabled,
      is_ambiguous: false,
      ambiguity_note: undefined,
    };

    setMessages((prev) =>
      prev.map((msg) => {
        if (!msg.proposals) return msg;
        return {
          ...msg,
          proposals: msg.proposals.map((p) =>
            p.proposal_id === editingProposal.proposal_id ? updated : p
          ),
        };
      })
    );
    success('Proposal updated');
  };

  // Read aloud TTS
  const handleReadAloud = async (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      await speakText(content);
      setIsSpeaking(false);
    }
  };

  const examplePrompts = [
    "I'll call Ma tomorrow at 7 PM and return Rahul's book on Friday",
    'What did I promise Rahul?',
    'Remind me to buy medicine after class',
    'Every Tuesday at 6 PM remind me to check on Dad',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-110px)] max-w-3xl mx-auto">
      {/* Assistant Header Pill (matching visual reference center screen) */}
      <div className="flex items-center justify-between pb-3 px-2 border-b border-[#F0E4DE]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#F0E4DE] shadow-warm-sm">
            <div className="w-5 h-5 rounded-full ai-gradient-badge flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-[#292526]">
              PromisePocket Assistant
            </span>
            <span className="w-2 h-2 rounded-full bg-[#27AE60]" title="Online" />
          </div>
        </div>

        <button
          onClick={() => {
            const initialWelcome: ChatMessage = {
              id: Math.random().toString(),
              role: 'assistant',
              content: 'Conversation reset. What promises can I help you remember today?',
              timestamp: format(new Date(), 'h:mm a'),
            };
            setMessages([initialWelcome]);
            toast('Chat cleared', undefined, 'info');
          }}
          className="text-xs font-semibold text-[#898487] hover:text-[#292526] flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-white transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
            >
              <div className="flex items-end gap-2 max-w-[88%] sm:max-w-[80%]">
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-full ai-gradient-badge flex items-center justify-center text-white shrink-0 mb-1 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-3xl p-4 transition-all shadow-warm-sm ${
                    isUser
                      ? 'bg-[#FF986F] text-white rounded-br-sm'
                      : msg.is_error
                      ? 'bg-[#FFF5F5] text-[#C0392B] border border-[#FFCDD2] rounded-bl-sm'
                      : 'bg-white text-[#292526] border border-[#F0E4DE] rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Grounded Citations if user asked about memory */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#F0E4DE] space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#898487] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF986F]" />
                        Matching Promises Found:
                      </span>
                      {msg.citations.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => navigate(`/promises`)}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#FFF9F5] hover:bg-[#FFE2D5]/40 border border-[#F0E4DE] text-xs font-semibold text-[#292526] cursor-pointer transition-colors"
                        >
                          <span>{c.title}</span>
                          <ExternalLink className="w-3 h-3 text-[#898487]" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Embedded Structured Proposal Cards */}
                  {msg.proposals && msg.proposals.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.proposals.map((proposal) => (
                        <ProposalCard
                          key={proposal.proposal_id}
                          proposal={proposal}
                          onAccept={handleAcceptProposal}
                          onReject={handleRejectProposal}
                          onEdit={handleEditProposal}
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Footer: Timestamp and Read Aloud */}
                  <div
                    className={`flex items-center justify-between mt-2 pt-1 text-[10px] ${
                      isUser ? 'text-white/80' : 'text-[#898487]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleReadAloud(msg.content)}
                        className="flex items-center gap-1 text-[#898487] hover:text-[#292526] ml-3 transition-colors"
                        title="Read aloud (ElevenLabs TTS)"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-[#FF986F]" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 max-w-[80%] animate-in fade-in">
            <div className="w-8 h-8 rounded-full ai-gradient-badge flex items-center justify-center text-white shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[#F0E4DE] rounded-3xl px-4 py-3 shadow-warm-sm flex items-center gap-2 text-xs text-[#898487]">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF986F]" />
              <span>Gemma AI is processing your promise...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
        {examplePrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-[#F0E4DE] text-[#292526] hover:bg-[#FFE2D5]/40 hover:border-[#FF986F] whitespace-nowrap transition-all shadow-warm-sm"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Composer Input Bar matching Screen 2 of Reference Image */}
      <div className="bg-white rounded-3xl p-2 sm:p-2.5 border border-[#F0E4DE] shadow-warm mt-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Button */}
          <button
            type="button"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isSending}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-[#E74C3C] text-white animate-pulse shadow-md'
                : 'text-[#898487] hover:text-[#292526] hover:bg-[#FFE2D5]/40'
            }`}
            title={isRecording ? 'Stop recording voice note' : 'Record voice note (ElevenLabs STT)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isRecording ? 'Listening to voice note...' : 'Ask anything here or say a promise...'}
            disabled={isSending}
            className="flex-1 bg-transparent px-2 text-sm text-[#292526] placeholder-[#898487] focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-11 h-11 rounded-full bg-[#FF986F] text-white flex items-center justify-center hover:bg-[#F28254] disabled:opacity-40 disabled:hover:bg-[#FF986F] transition-all shadow-warm-sm shrink-0 active:scale-95"
            title="Send"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Edit Proposal Modal */}
      <EditCommitmentModal
        isOpen={isEditModalOpen}
        commitment={editingProposal}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingProposal(null);
        }}
        onSave={handleSaveEditedProposal}
      />
    </div>
  );
};
