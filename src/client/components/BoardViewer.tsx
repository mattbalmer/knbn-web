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
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const [directoryPathInput, setDirectoryPathInput] = useState<string>('');
  const [cwd, setCwd] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedTypeaheadIndex, setSelectedTypeaheadIndex] = useState(-1);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchBoardFiles();
    fetchVersionInfo();
    fetchCwd();
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
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

  const validateDirectory = async (path: string) => {
    try {
      const url = `/api/directories?path=${encodeURIComponent(path)}`;
      const response = await fetch(url);
      return response.ok;
    } catch (err) {
      return false;
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


  const handleDirectoryInputFocus = () => {
    const pathParts = directoryPathInput.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1).join('/');
    fetchDirectories(parentPath);
    setShowTypeahead(true);
  };

  const handleDirectoryInputBlur = () => {
    // Delay hiding to allow click on typeahead items
    setTimeout(() => setShowTypeahead(false), 150);
  };

  const handleTypeaheadSelect = (directory: string) => {
    const pathParts = directoryPathInput.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1);
    const newPath = [...parentPath, directory].join('/') + '/';
    setDirectoryPathInput(newPath);
    setDirectoryPath(newPath);
    fetchBoardFiles(newPath);
    setSelectedBoard('');
    setBoardContent(null);
    setShowTypeahead(false);
    
    // Restore focus to input after selection
    setTimeout(() => {
      pathInputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showTypeahead || directories.length === 0) return;

    const pathParts = directoryPathInput.split('/').filter(p => p.length > 0);
    const currentInput = pathParts[pathParts.length - 1] || '';
    const filteredDirectories = directories.filter(dir => 
      dir.toLowerCase().startsWith(currentInput.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedTypeaheadIndex(prev => 
        prev < filteredDirectories.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      setSelectedTypeaheadIndex(prev => 
        prev > 0 ? prev - 1 : filteredDirectories.length - 1
      );
    } else if (e.key === 'Enter' && selectedTypeaheadIndex >= 0) {
      e.preventDefault();
      e.stopPropagation();
      handleTypeaheadSelect(filteredDirectories[selectedTypeaheadIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setShowTypeahead(false);
      setSelectedTypeaheadIndex(-1);
      // Ensure input stays focused
      pathInputRef.current?.focus();
    }
  };

  const handleDirectoryPathInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDirectoryPathInput(inputValue);
    setSelectedTypeaheadIndex(-1);
    
    // Clear any existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Get the parent directory for typeahead suggestions
    const pathParts = inputValue.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1).join('/');
    fetchDirectories(parentPath);
    
    // Show typeahead if there's partial input
    const currentInput = pathParts[pathParts.length - 1] || '';
    setShowTypeahead(currentInput.length > 0 || inputValue.endsWith('/'));
    
    // Debounced validation - only validate if the path looks complete (ends with '/' or has no partial segment)
    if (inputValue === '' || inputValue.endsWith('/')) {
      // Immediate validation for empty or complete paths
      validateAndUpdate(inputValue);
    } else {
      // Debounced validation for partial paths
      validationTimeoutRef.current = setTimeout(() => {
        validateAndUpdate(inputValue);
      }, 500);
    }
  };

  const validateAndUpdate = async (path: string) => {
    const isValid = path === '' || await validateDirectory(path);
    if (isValid) {
      setDirectoryPath(path);
      fetchBoardFiles(path);
      setSelectedBoard('');
      setBoardContent(null);
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
      <Header
        cwd={cwd}
        directoryPathInput={directoryPathInput}
        boardFiles={boardFiles}
        selectedBoard={selectedBoard}
        loadingBoards={loadingBoards}
        directories={directories}
        showTypeahead={showTypeahead}
        selectedTypeaheadIndex={selectedTypeaheadIndex}
        versionInfo={versionInfo}
        onDirectoryPathInputChange={handleDirectoryPathInputChange}
        onDirectoryInputFocus={handleDirectoryInputFocus}
        onDirectoryInputBlur={handleDirectoryInputBlur}
        onKeyDown={handleKeyDown}
        onBoardSelect={handleBoardSelect}
        onCreateBoard={handleCreateBoard}
        onTypeaheadSelect={handleTypeaheadSelect}
        onTypeaheadIndexChange={setSelectedTypeaheadIndex}
        pathInputRef={pathInputRef}
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