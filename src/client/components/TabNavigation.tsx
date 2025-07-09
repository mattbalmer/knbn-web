import React from 'react';

export type TabType = 'backlog' | 'sprint' | 'all-tasks' | 'manage';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabType; label: string }[] = [
    { id: 'backlog', label: 'Backlog' },
    { id: 'sprint', label: 'Sprint' },
    { id: 'all-tasks', label: 'All Tasks' },
    { id: 'manage', label: 'Manage' },
  ];

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;