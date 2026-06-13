interface TranscriptOverlayProps {
  text?: string;
}

export function TranscriptOverlay({ text }: TranscriptOverlayProps) {
  if (!text) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-[70%]">
      <div className="bg-canvas-bg/70 backdrop-blur-md border border-panel-border px-5 py-2.5 rounded-xl">
        <p className="text-sm text-text-primary text-center leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
