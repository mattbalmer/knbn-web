import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = '' }) => {
  return (
    <div className={`spinner-container ${className}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default Spinner;