interface TranscriptOverlayProps {
  text?: string;
}

export function TranscriptOverlay({ text }: TranscriptOverlayProps) {
  if (!text) return null;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm max-w-[80%] truncate">
      {text}
    </div>
  );
}
