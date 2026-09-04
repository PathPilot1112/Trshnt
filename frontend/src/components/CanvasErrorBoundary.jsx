import React from 'react';

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("Canvas/WebGL component fallback triggered:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          color: '#39FF14',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '12px',
          opacity: 0.8
        }}>
          ☢ [TACTICAL TELEMETRY ACTIVE]
        </div>
      );
    }
    return this.props.children;
  }
}

export default CanvasErrorBoundary;
