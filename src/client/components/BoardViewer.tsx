import React, { useState, useEffect } from 'react';
import KanbanBoard from './KanbanBoard';
import TabNavigation, { TabType } from './TabNavigation';
import BacklogTab from './BacklogTab';
import SprintTab from './SprintTab';
import ManageTab from './ManageTab';
import VersionTooltip from './VersionTooltip';
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
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const [cwd, setCwd] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedTypeaheadIndex, setSelectedTypeaheadIndex] = useState(-1);

  useEffect(() => {
    fetchBoardFiles();
    fetchVersionInfo();
    fetchCwd();
  }, []);

  const fetchBoardFiles = async (path?: string) => {
    setLoadingBoards(true);
    try {
      const url = path ? `/api/boards?path=${encodeURIComponent(path)}` : '/api/boards';
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

  const fetchCwd = async () => {
    try {
      const response = await fetch('/api/cwd');
      if (!response.ok) throw new Error('Failed to fetch CWD');
      const data = await response.json();
      setCwd(data.cwd);
    } catch (err) {
      console.error('Failed to load CWD:', err);
    }
  };

  const fetchDirectories = async (path: string) => {
    try {
      const url = `/api/directories?path=${encodeURIComponent(path)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch directories');
      const data = await response.json();
      setDirectories(data.directories || []);
    } catch (err) {
      console.error('Failed to load directories:', err);
      setDirectories([]);
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
    fetchBoardFiles();
  };

  const handleCancelNewBoard = () => {
    setShowNewBoardForm(false);
  };

  const handleDirectoryPathChange = (path: string) => {
    setDirectoryPath(path);
    setSelectedBoard('');
    setBoardContent(null);
    setSelectedTypeaheadIndex(-1);
    fetchBoardFiles(path);
    
    // Get the parent directory for typeahead suggestions
    const pathParts = path.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1).join('/');
    fetchDirectories(parentPath);
    
    // Show typeahead if there's partial input
    const currentInput = pathParts[pathParts.length - 1] || '';
    setShowTypeahead(currentInput.length > 0 || path.endsWith('/'));
  };

  const handleDirectoryInputFocus = () => {
    const pathParts = directoryPath.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1).join('/');
    fetchDirectories(parentPath);
    setShowTypeahead(true);
  };

  const handleDirectoryInputBlur = () => {
    // Delay hiding to allow click on typeahead items
    setTimeout(() => setShowTypeahead(false), 150);
  };

  const handleTypeaheadSelect = (directory: string) => {
    const pathParts = directoryPath.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1);
    const newPath = [...parentPath, directory].join('/');
    handleDirectoryPathChange(newPath + '/');
    setShowTypeahead(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showTypeahead || directories.length === 0) return;

    const pathParts = directoryPath.split('/').filter(p => p.length > 0);
    const currentInput = pathParts[pathParts.length - 1] || '';
    const filteredDirectories = directories.filter(dir => 
      dir.toLowerCase().startsWith(currentInput.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedTypeaheadIndex(prev => 
        prev < filteredDirectories.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedTypeaheadIndex(prev => 
        prev > 0 ? prev - 1 : filteredDirectories.length - 1
      );
    } else if (e.key === 'Enter' && selectedTypeaheadIndex >= 0) {
      e.preventDefault();
      handleTypeaheadSelect(filteredDirectories[selectedTypeaheadIndex]);
    } else if (e.key === 'Escape') {
      setShowTypeahead(false);
      setSelectedTypeaheadIndex(-1);
    }
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

  const hasNoBoards = !loadingBoards && boardFiles.length === 0;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">KnBn Board Viewer</h1>
        </div>
        
        <div className="header-center">
          <div className="path-selector">
            <span className="path-selector-label">Directory:</span>
            <div className="path-input-wrapper">
              <div className="path-input-container">
                <input
                  type="text"
                  value={cwd}
                  disabled
                  className="path-input-cwd"
                  title="Working directory where knbn-web was launched"
                />
                <span className="path-separator">/</span>
                <input
                  type="text"
                  value={directoryPath}
                  onChange={(e) => handleDirectoryPathChange(e.target.value)}
                  onFocus={handleDirectoryInputFocus}
                  onBlur={handleDirectoryInputBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter relative path (e.g., projects/my-project)"
                  className="path-input-relative"
                  autoComplete="off"
                />
              </div>
              {showTypeahead && directories.length > 0 && (() => {
                const pathParts = directoryPath.split('/').filter(p => p.length > 0);
                const currentInput = pathParts[pathParts.length - 1] || '';
                const filteredDirectories = directories.filter(dir => 
                  dir.toLowerCase().startsWith(currentInput.toLowerCase())
                );
                
                return filteredDirectories.length > 0 && (
                  <div className="typeahead-dropdown">
                    {filteredDirectories.map((directory, index) => (
                      <div
                        key={directory}
                        className={`typeahead-item ${index === selectedTypeaheadIndex ? 'selected' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleTypeaheadSelect(directory)}
                        onMouseEnter={() => setSelectedTypeaheadIndex(index)}
                      >
                        📁 {directory}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="board-selector">
            <span className="board-selector-label">Board:</span>
            {loadingBoards ? (
              <select disabled>
                <option>Loading boards...</option>
              </select>
            ) : boardFiles.length === 0 ? (
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
            <button 
              className="create-board-button"
              onClick={handleCreateBoard}
              disabled={loadingBoards || hasNoBoards}
            >
              + New Board
            </button>
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