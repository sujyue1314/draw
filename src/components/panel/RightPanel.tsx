import { ComponentList } from './ComponentList';
import { HistoryList } from './HistoryList';

export function RightPanel() {
  return (
    <aside className="w-64 border-l border-gray-200 flex flex-col overflow-hidden">
      <ComponentList />
      <HistoryList />
    </aside>
  );
}
