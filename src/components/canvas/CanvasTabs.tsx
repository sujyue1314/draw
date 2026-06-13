export function CanvasTabs() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200">
      <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
        画布1
      </button>
      <button className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded">
        +
      </button>
    </div>
  );
}
