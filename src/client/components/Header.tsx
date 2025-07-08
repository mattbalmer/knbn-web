import React, { useRef, useState, useEffect } from 'react';
import VersionTooltip from './VersionTooltip';

interface BoardFile {
  name: string;
  path: string;
}

interface VersionInfo {
  knbnWeb: string;
  knbnCore: string;
  knbnBoard: string;
}

interface HeaderProps {
  // Board state
  boardFiles: BoardFile[];
  selectedBoard: string;
  loadingBoards: boolean;
  
  // Version info
  versionInfo: VersionInfo | null;
  
  // Event handlers
  onDirectoryChange: (directoryPath: string) => void;
  onBoardSelect: (boardPath: string) => void;
  onCreateBoard: () => void;
}

const Header: React.FC<HeaderProps> = ({
  boardFiles,
  selectedBoard,
  loadingBoards,
  versionInfo,
  onDirectoryChange,
  onBoardSelect,
  onCreateBoard
}) => {
  // Internal state for path/directory management
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const [directoryPathInput, setDirectoryPathInput] = useState<string>('');
  const [cwd, setCwd] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedTypeaheadIndex, setSelectedTypeaheadIndex] = useState(-1);
  const pathInputRef = useRef<HTMLInputElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasNoBoards = !loadingBoards && boardFiles.length === 0;

  // Query string management functions
  const getDirectoryFromUrl = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('dir') || '';
  };

  const updateUrlWithDirectory = (path: string) => {
    const url = new URL(window.location.href);
    if (path) {
      url.searchParams.set('dir', path);
    } else {
      url.searchParams.delete('dir');
    }
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    fetchCwd();
    
    // Initialize directory path from URL
    const initialDir = getDirectoryFromUrl();
    if (initialDir) {
      setDirectoryPath(initialDir);
      setDirectoryPathInput(initialDir);
      onDirectoryChange(initialDir);
    }
  }, []);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

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
    const pathParts = directoryPathInput.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.slice(0, -1);
    const newPath = [...parentPath, directory].join('/') + '/';
    setDirectoryPathInput(newPath);
    setDirectoryPath(newPath);
    updateUrlWithDirectory(newPath);
    onDirectoryChange(newPath);
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
    
    // Get the parent directory for typeahead suggestions from validated path
    const pathParts = directoryPath.split('/').filter(p => p.length > 0);
    const parentPath = pathParts.join('/');
    fetchDirectories(parentPath);
    
    // Show typeahead if there's partial input  
    const inputParts = inputValue.split('/').filter(p => p.length > 0);
    const currentInput = inputParts[inputParts.length - 1] || '';
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
      updateUrlWithDirectory(path);
      onDirectoryChange(path);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">KnBn Board Viewer</h1>
        <div className="path-selector">
          {/*<span className="path-selector-label">Directory:</span>*/}
          <div className="path-input-wrapper">
            <div className="path-input-container">
              <input
                id={'cwd-input'}
                type="text"
                value={cwd}
                disabled
                className="path-input-cwd"
                title="Working directory where knbn-web was launched"
              />
              <span className="path-separator">/</span>
              <input
                id={'dirpath-input'}
                ref={pathInputRef}
                type="text"
                value={directoryPathInput}
                onChange={handleDirectoryPathInputChange}
                onFocus={handleDirectoryInputFocus}
                onBlur={handleDirectoryInputBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter relative path (e.g., projects/my-project)"
                className="path-input-relative"
                autoComplete="off"
              />
            </div>
            {showTypeahead && directories.length > 0 && (() => {
              const pathParts = directoryPathInput.split('/').filter(p => p.length > 0);
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleTypeaheadSelect(directory);
                      }}
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
          {/*<span className="board-selector-label">Board:</span>*/}
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
              onChange={(e) => onBoardSelect(e.target.value)}
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
            onClick={onCreateBoard}
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
  );
};

export default Header;