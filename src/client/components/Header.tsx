import React, { useRef, useState, useEffect } from 'react';
import VersionTooltip from './VersionTooltip';
import { Button } from './common/Button';
import Tooltip from './common/Tooltip';

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
  recursive: boolean;

  // Version info
  versionInfo: VersionInfo | null;

  // Event handlers
  onDirectoryChange: (directoryPath: string) => void;
  onBoardSelect: (boardPath: string) => void;
  onCreateBoard: () => void;
  onRecursiveChange: (recursive: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  boardFiles,
  selectedBoard,
  loadingBoards,
  recursive,
  versionInfo,
  onDirectoryChange,
  onBoardSelect,
  onCreateBoard,
  onRecursiveChange
}) => {
  // Internal state for path/directory management
  const [directoryPath, setDirectoryPath] = useState<string>('');
  const [directoryPathInput, setDirectoryPathInput] = useState<string>('');
  const [cwd, setCwd] = useState<string>('');
  const [lastValidPath, setLastValidPath] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const [selectedTypeaheadIndex, setSelectedTypeaheadIndex] = useState(-1);
  const [cwdCollapsed, setCwdCollapsed] = useState(true);
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

  const toggleCwdCollapsed = () => {
    setCwdCollapsed(!cwdCollapsed);
  };

  useEffect(() => {
    fetchCwd();
    
    // Initialize directory path from URL
    const initialDir = getDirectoryFromUrl();
    if (initialDir) {
      setDirectoryPath(initialDir);
      setDirectoryPathInput(initialDir);
      setLastValidPath(initialDir);
      onDirectoryChange(initialDir);
    } else {
      onDirectoryChange('');
    }
  }, []);

  useEffect(() => {
    // Initialize lastValidPath to CWD when CWD is loaded
    if (cwd && !lastValidPath) {
      setLastValidPath('');
    }
  }, [cwd, lastValidPath]);

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
    fetchDirectories(lastValidPath);
    setShowTypeahead(true);
  };

  const handleDirectoryInputBlur = () => {
    // Delay hiding to allow click on typeahead items
    setTimeout(() => setShowTypeahead(false), 150);
  };

  const handleTypeaheadSelect = (directory: string) => {
    const newPath = lastValidPath ? `${lastValidPath}/${directory}/` : `${directory}/`;
    setDirectoryPathInput(newPath);
    setLastValidPath(newPath);
    setShowTypeahead(false);
    
    // Validate and update - this will call parent callback since it's a complete path
    validateAndUpdate(newPath);
    
    // Restore focus to input after selection
    setTimeout(() => {
      pathInputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showTypeahead || directories.length === 0) return;

    // Get the current input segment (what the user is typing)
    const inputParts = directoryPathInput.split('/').filter(p => p.length > 0);
    const lastValidParts = lastValidPath.split('/').filter(p => p.length > 0);
    
    let currentInput = '';
    if (inputParts.length > lastValidParts.length) {
      currentInput = inputParts[lastValidParts.length] || '';
    } else if (directoryPathInput.endsWith('/')) {
      currentInput = '';
    }
    
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
    
    // Update last valid path if input ends with '/' (user is ready to go deeper)
    if (inputValue.endsWith('/') && inputValue !== lastValidPath) {
      setLastValidPath(inputValue);
    }
    
    // Fetch directories for typeahead from last valid path
    fetchDirectories(lastValidPath);
    
    // Show typeahead if there's partial input  
    const inputParts = inputValue.split('/').filter(p => p.length > 0);
    const currentInput = inputParts[inputParts.length - 1] || '';
    setShowTypeahead(currentInput.length > 0 || inputValue.endsWith('/'));
    
    // Only validate and call parent callbacks for paths that are complete or empty
    if (inputValue === '' || inputValue.endsWith('/')) {
      // Immediate validation for empty or complete paths
      validateAndUpdate(inputValue);
    } else {
      // For partial paths, only validate in background without calling parent
      validationTimeoutRef.current = setTimeout(async () => {
        const isValid = await validateDirectory(inputValue);
        if (isValid) {
          // Only update internal state, don't call parent yet
          setDirectoryPath(inputValue);
          updateUrlWithDirectory(inputValue);
          setLastValidPath(inputValue);
        }
      }, 500);
    }
  };

  const validateAndUpdate = async (path: string) => {
    const isValid = path === '' || await validateDirectory(path);
    if (isValid) {
      setDirectoryPath(path);
      updateUrlWithDirectory(path);
      // Only call parent callback for valid, complete paths
      onDirectoryChange(path);
      // Update last valid path when we have a valid directory
      setLastValidPath(path);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">KnBn</h1>
        <div className="path-selector">
          {/*<span className="path-selector-label">Directory:</span>*/}
          <div className="path-input-wrapper">
            <div className="path-input-container">
              <span
                className={`path-input-cwd ${cwdCollapsed ? 'collapsed' : 'expanded'}`}
                title={cwdCollapsed ? 'Click to expand full path' : 'Working directory where knbn-web was launched'}
                onClick={toggleCwdCollapsed}
              >
                {cwdCollapsed ? '~' : cwd}
              </span>
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
              // Get the current input segment (what the user is typing)
              const inputParts = directoryPathInput.split('/').filter(p => p.length > 0);
              const lastValidParts = lastValidPath.split('/').filter(p => p.length > 0);
              
              // Find the current input segment by comparing with last valid path
              let currentInput = '';
              if (inputParts.length > lastValidParts.length) {
                currentInput = inputParts[lastValidParts.length] || '';
              } else if (directoryPathInput.endsWith('/')) {
                currentInput = '';
              }
              
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
          <Button
            color="primary"
            onClick={onCreateBoard}
            disabled={loadingBoards || hasNoBoards}
          >
            + New Board
          </Button>

          <div className="recursive-toggle">
            <Tooltip
              content="Enabling recursive mode searches all subdirectories, which can be quite slow"
              position="bottom"
            >
              <label>
                <input
                  type="checkbox"
                  checked={recursive}
                  onChange={(e) => onRecursiveChange(e.target.checked)}
                />
                <span>Recursive</span>
              </label>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className="header-right">
        <VersionTooltip versionInfo={versionInfo} />
      </div>
    </header>
  );
};

export default Header;