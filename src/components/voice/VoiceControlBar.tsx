export function VoiceControlBar() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-200">
      <button className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg">
        🎤
      </button>
      <span className="text-sm text-gray-500">正在聆听...</span>
    </div>
  );
}
