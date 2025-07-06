import React, { useRef } from 'react';
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
  // CWD and path state
  cwd: string;
  directoryPathInput: string;
  
  // Board state
  boardFiles: BoardFile[];
  selectedBoard: string;
  loadingBoards: boolean;
  
  // Typeahead state
  directories: string[];
  showTypeahead: boolean;
  selectedTypeaheadIndex: number;
  
  // Version info
  versionInfo: VersionInfo | null;
  
  // Event handlers
  onDirectoryPathInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDirectoryInputFocus: () => void;
  onDirectoryInputBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBoardSelect: (boardPath: string) => void;
  onCreateBoard: () => void;
  onTypeaheadSelect: (directory: string) => void;
  onTypeaheadIndexChange: (index: number) => void;
  
  // Refs
  pathInputRef: React.RefObject<HTMLInputElement>;
}

const Header: React.FC<HeaderProps> = ({
  cwd,
  directoryPathInput,
  boardFiles,
  selectedBoard,
  loadingBoards,
  directories,
  showTypeahead,
  selectedTypeaheadIndex,
  versionInfo,
  onDirectoryPathInputChange,
  onDirectoryInputFocus,
  onDirectoryInputBlur,
  onKeyDown,
  onBoardSelect,
  onCreateBoard,
  onTypeaheadSelect,
  onTypeaheadIndexChange,
  pathInputRef
}) => {
  const hasNoBoards = !loadingBoards && boardFiles.length === 0;

  return (
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
                ref={pathInputRef}
                type="text"
                value={directoryPathInput}
                onChange={onDirectoryPathInputChange}
                onFocus={onDirectoryInputFocus}
                onBlur={onDirectoryInputBlur}
                onKeyDown={onKeyDown}
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
                        onTypeaheadSelect(directory);
                      }}
                      onMouseEnter={() => onTypeaheadIndexChange(index)}
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