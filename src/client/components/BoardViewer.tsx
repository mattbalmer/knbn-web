import React, { useState, useEffect, useRef } from 'react';
import KanbanBoard from './KanbanBoard';
import TabNavigation, { TabType } from './TabNavigation';
import BacklogTab from './BacklogTab';
import SprintTab from './SprintTab';
import ManageTab from './ManageTab';
import Header from './Header';
import NewBoardForm from './NewBoardForm';
import Spinner from './Spinner';
import { Board } from '../knbn/types';
import FirstBoardForm from './FirstBoardForm';

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
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [error, setError] = useState<string>('');
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all-tasks');
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);

  // Initialize recursive from URL
  const getRecursiveFromUrl = (): boolean => {
    const urlParams = new URLSearchParams(window.location.search);
    const recursiveParam = urlParams.get('r');
    return recursiveParam === 'true' || recursiveParam === '1';
  };

  const [recursive, setRecursive] = useState<boolean>(getRecursiveFromUrl());

  const updateUrlWithRecursive = (isRecursive: boolean) => {
    const url = new URL(window.location.href);
    if (isRecursive) {
      url.searchParams.set('r', '1');
    } else {
      url.searchParams.delete('r');
    }
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  const fetchBoardFiles = async ({ path, recursive, force }: {
    path?: string;
    recursive?: boolean;
    force?: boolean;
  } = {}) => {
    setLoadingBoards(true);
    try {
      const params = new URLSearchParams();
      if (path) {
        params.append('path', path);
      }
      params.append('recursive', recursive ? 'true' : 'false');
      if (force) {
        params.append('force', 'true');
      }

      const url = `/api/boards?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch board files');
      }
      const files = await response.json();
      setBoardFiles(files);
      if (!selectedBoard && files?.[0]) {
        handleBoardSelect(files[0].path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load board files');
    } finally {
      setLoadingBoards(false);
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

  const handleCreateBoard = () => {
    setShowNewBoardForm(true);
  };

  const handleBoardCreated = () => {
    setShowNewBoardForm(false);
    fetchBoardFiles({
      recursive,
    });
  };

  const handleCancelNewBoard = () => {
    setShowNewBoardForm(false);
  };


  const handleDirectoryChange = (path: string) => {
    console.log('handleDirectoryChange', path);
    setSelectedBoard('');
    setBoardContent(null);
    fetchBoardFiles({ path, recursive });
  };

  const handleRecursiveChange = (isRecursive: boolean) => {
    setRecursive(isRecursive);
    updateUrlWithRecursive(isRecursive);
    // Re-fetch board files with the new recursive setting
    const urlParams = new URLSearchParams(window.location.search);
    const currentPath = urlParams.get('dir') || '';
    setSelectedBoard('');
    setBoardContent(null);
    fetchBoardFiles({ path: currentPath, recursive: isRecursive });
  };

  const handleRefresh = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPath = urlParams.get('dir') || '';
    fetchBoardFiles({ path: currentPath, recursive, force: true });
  };

  const renderTabContent = () => {
    if (!boardContent) return null;
    
    switch (activeTab) {
      case 'backlog':
        return (
          <BacklogTab
            board={boardContent}
            boardPath={selectedBoard}
            onTaskUpdate={() => {
              if (selectedBoard) {
                fetchBoardContent(selectedBoard);
              }
            }}
          />
        );
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
            showBacklog={true}
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
        return (
          <ManageTab 
            board={boardContent} 
            boardPath={selectedBoard}
            onBoardUpdate={() => {
              if (selectedBoard) {
                fetchBoardContent(selectedBoard);
              }
            }}
          />
        );
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

  const hasNoBoards = !loadingBoards && boardFiles.length === 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Header
        boardFiles={boardFiles}
        selectedBoard={selectedBoard}
        loadingBoards={loadingBoards}
        recursive={recursive}
        versionInfo={versionInfo}
        onDirectoryChange={handleDirectoryChange}
        onBoardSelect={handleBoardSelect}
        onCreateBoard={handleCreateBoard}
        onRecursiveChange={handleRecursiveChange}
        onRefresh={handleRefresh}
      />

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

      {!boardContent && loading && <Spinner />}

      {boardContent && (
        <div>
          <div className="board-header">
            <h2>{boardContent.name}</h2>
            {boardContent.description && (
              <p className="board-description">{boardContent.description}</p>
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

      {
        hasNoBoards ?
          <FirstBoardForm onBoardCreated={handleBoardCreated} />
          : showNewBoardForm
            ? <NewBoardForm
              onBoardCreated={handleBoardCreated}
              onCancel={handleCancelNewBoard}
            />
          : null
      }
    </div>
  );
};

export default BoardViewer;