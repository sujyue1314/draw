import { TopBar } from '../ui/TopBar';
import { CanvasArea } from '../canvas/CanvasArea';
import { CanvasTabs } from '../canvas/CanvasTabs';
import { RightPanel } from '../panel/RightPanel';
import { VoiceControlBar } from '../voice/VoiceControlBar';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function AppLayout() {
  return (
    <div className="h-screen flex flex-col bg-canvas-bg">
      <TopBar />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <CanvasArea />
          <CanvasTabs />
        </div>
        <RightPanel />
      </div>

      <VoiceControlBar />
      <ConfirmDialog />
    </div>
  );
}
