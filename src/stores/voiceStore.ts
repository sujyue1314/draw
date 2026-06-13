import { create } from 'zustand';
import type { ConversationTurn } from '../types/canvas';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface VoiceStore {
  status: VoiceStatus;
  transcript: string;
  interimTranscript: string;
  isSystemSpeaking: boolean;
  shouldListen: boolean;
  conversationHistory: ConversationTurn[];

  setStatus: (status: VoiceStatus) => void;
  setTranscript: (transcript: string) => void;
  setInterimTranscript: (interim: string) => void;
  setIsSystemSpeaking: (speaking: boolean) => void;
  setShouldListen: (shouldListen: boolean) => void;
  addConversationTurn: (turn: ConversationTurn) => void;
  clearConversationHistory: () => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  status: 'idle',
  transcript: '',
  interimTranscript: '',
  isSystemSpeaking: false,
  shouldListen: false,
  conversationHistory: [],

  setStatus: (status) => set({ status }),
  setTranscript: (transcript) => set({ transcript }),
  setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
  setIsSystemSpeaking: (isSystemSpeaking) => set({ isSystemSpeaking }),
  setShouldListen: (shouldListen) => set({ shouldListen }),
  addConversationTurn: (turn) =>
    set((state) => ({
      conversationHistory: [...state.conversationHistory, turn],
    })),
  clearConversationHistory: () => set({ conversationHistory: [] }),
}));
