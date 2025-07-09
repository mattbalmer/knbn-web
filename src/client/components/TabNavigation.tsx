import React from 'react';
import { Button } from './common/Button';

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
        <Button
          key={tab.id}
          color="default"
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
};

export default TabNavigation;