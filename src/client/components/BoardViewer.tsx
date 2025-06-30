import React, { useState, useEffect } from 'react';
import KanbanBoard from './KanbanBoard';
import TabNavigation, { TabType } from './TabNavigation';
import BacklogTab from './BacklogTab';
import SprintTab from './SprintTab';
import ManageTab from './ManageTab';
import VersionTooltip from './VersionTooltip';
import { Board } from '../knbn/types';

interface BoardFile {
  name: string;
  path: string;
}

interface VersionInfo {
  knbnWeb: string;
  knbnCore: string;
  knbnBoard: string;
}

const BoardViewer: React.FC = () => {
  const [boardFiles, setBoardFiles] = useState<BoardFile[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [boardContent, setBoardContent] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all-tasks');

  useEffect(() => {
    fetchBoardFiles();
    fetchVersionInfo();
  }, []);

  const fetchBoardFiles = async () => {
    try {
      const response = await fetch('/api/boards');
      if (!response.ok) throw new Error('Failed to fetch board files');
      const files = await response.json();
      setBoardFiles(files);
      if (!selectedBoard && files?.[0]) {
        handleBoardSelect(files[0].path);
      }
    } catch (err) {
      setError('Failed to load board files');
    }
  };

  const fetchVersionInfo = async () => {
    try {
      const response = await fetch('/api/version');
      if (!response.ok) throw new Error('Failed to fetch version info');
      const version = await response.json();
      setVersionInfo(version);
    } catch (err) {
      console.error('Failed to load version info:', err);
    }
  };

  const fetchBoardContent = async (boardPath: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/boards/${encodeURIComponent(boardPath)}`);
      if (!response.ok) throw new Error('Failed to fetch board content');
      const content = await response.json();
      setBoardContent(content);
    } catch (err) {
      setError('Failed to load board content');
    } finally {
      setLoading(false);
    }
  };

  const handleBoardSelect = (boardPath: string) => {
    setSelectedBoard(boardPath);
    fetchBoardContent(boardPath);
  };

  const renderTabContent = () => {
    if (!boardContent) return null;
    
    switch (activeTab) {
      case 'backlog':
        return <BacklogTab />;
      case 'sprint':
        return (
          <SprintTab
            board={boardContent}
            boardPath={selectedBoard}
            onTaskUpdate={() => {
              if (selectedBoard) {
                fetchBoardContent(selectedBoard);
              }
            }}
          />
        );
      case 'all-tasks':
        return (
          <KanbanBoard 
            board={boardContent} 
            boardPath={selectedBoard}
            onTaskUpdate={() => {
              if (selectedBoard) {
                fetchBoardContent(selectedBoard);
              }
            }}
          />
        );
      case 'manage':
        return <ManageTab />;
      default:
        return (
          <KanbanBoard 
            board={boardContent} 
            boardPath={selectedBoard}
            onTaskUpdate={() => {
              if (selectedBoard) {
                fetchBoardContent(selectedBoard);
              }
            }}
          />
        );
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">KnBn Board Viewer</h1>
        </div>
        
        <div className="header-center">
          <div className="board-selector">
            <span className="board-selector-label">Board:</span>
            {boardFiles.length === 0 ? (
              <select disabled>
                <option>No .knbn files found</option>
              </select>
            ) : (
              <select 
                value={selectedBoard} 
                onChange={(e) => handleBoardSelect(e.target.value)}
              >
                <option value="">-- Select a board file --</option>
                {boardFiles.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="header-right">
          <VersionTooltip versionInfo={versionInfo} />
        </div>
      </header>

      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          border: '1px solid #ff9999',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading && <p>Loading board content...</p>}

      {boardContent && !loading && (
        <div>
          <div className="board-header">
            <h2>{boardContent.configuration.name}</h2>
            {boardContent.configuration.description && (
              <p className="board-description">{boardContent.configuration.description}</p>
            )}
          </div>

          <TabNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardViewer;