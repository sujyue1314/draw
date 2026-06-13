export function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
      <h1 className="text-lg font-semibold">🎨 VoiceCanvas</h1>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>16:9</span>
        <span>🎙️ 聆听中</span>
      </div>
    </header>
  );
}
