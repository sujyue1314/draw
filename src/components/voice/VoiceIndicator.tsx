import { memo } from 'react';
import { useVoiceStore } from '../../stores/voiceStore';
import type { VoiceStatus } from '../../stores/voiceStore';

const COLOR_MAP: Record<VoiceStatus, string> = {
  idle: 'bg-text-muted',
  listening: 'bg-status-listen',
  processing: 'bg-status-process',
  speaking: 'bg-status-speak',
};

export const VoiceIndicator = memo(function VoiceIndicator() {
  const status = useVoiceStore((s) => s.status);
  const color = COLOR_MAP[status];
  const isPulsing = status === 'listening' || status === 'processing';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full ${color} ${isPulsing ? 'animate-pulse' : ''}`}
      />
    </div>
  );
});
