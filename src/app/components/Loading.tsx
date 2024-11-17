import React from 'react';

interface LoadingProps {
  loadingText?: string; // Optional prop for customizable text
  fullScreen?: boolean; // Optional prop to determine if it covers the full screen
}

const Loading: React.FC<LoadingProps> = ({ loadingText = "Loading your cloud...", fullScreen = true }) => {
  return (
    <div className={`loading-screen ${fullScreen ? 'full-screen' : ''}`}>
      <img src="/logos/Logo2.png" alt="Cloud Logo" className="loading-logo" />
      <div className="loading-spinner"></div>
      <div className="loading-text">{loadingText}</div>
    </div>
  );
};

export default Loading;
