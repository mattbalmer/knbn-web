import React, { useState, useEffect } from 'react';

interface Board {
  config: {
    columns: string[];
  };
  tasks: Record<string, any>;
  metadata: {
    nextId: number;
  };
}

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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>KnBn Board Viewer</h1>
        {versionInfo && (
          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'right',
            lineHeight: '1.4'
          }}>
            <div>KnBn Core v{versionInfo.knbnCore}</div>
            <div>KnBn Board v{versionInfo.knbnBoard}</div>
            <div>KnBn Web v{versionInfo.knbnWeb}</div>
          </div>
        )}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Select Board File</h2>
        {boardFiles.length === 0 ? (
          <p>No .knbn files found in current directory</p>
        ) : (
          <select 
            value={selectedBoard} 
            onChange={(e) => handleBoardSelect(e.target.value)}
            style={{ padding: '8px', fontSize: '14px', minWidth: '200px' }}
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
          <h2>Board Content</h2>
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            overflow: 'auto'
          }}>
            <pre style={{ 
              margin: 0, 
              fontSize: '12px',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(boardContent, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardViewer;