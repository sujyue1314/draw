import { ComponentList } from './ComponentList';
import { HistoryList } from './HistoryList';

export function RightPanel() {
  return (
    <aside className="w-60 bg-panel-bg border-l border-panel-border flex flex-col overflow-hidden shrink-0">
      <ComponentList />
      <HistoryList />
    </aside>
  );
}
