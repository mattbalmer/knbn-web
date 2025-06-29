import React, { useState } from 'react';

interface VersionInfo {
  knbnWeb: string;
  knbnCore: string;
  knbnBoard: string;
}

interface VersionTooltipProps {
  versionInfo: VersionInfo | null;
}

const VersionTooltip: React.FC<VersionTooltipProps> = ({ versionInfo }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!versionInfo) return null;

  return (
    <div className="version-tooltip-container">
      <button
        className="version-info-button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label="Version Information"
      >
        ?
      </button>
      
      {showTooltip && (
        <div className="version-tooltip">
          <div className="version-tooltip-content">
            <div className="version-item">
              <strong>KnBn Core:</strong> v{versionInfo.knbnCore}
            </div>
            <div className="version-item">
              <strong>KnBn Board:</strong> v{versionInfo.knbnBoard}
            </div>
            <div className="version-item">
              <strong>KnBn Web:</strong> v{versionInfo.knbnWeb}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionTooltip;