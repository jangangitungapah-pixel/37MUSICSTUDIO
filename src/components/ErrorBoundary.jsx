import React from 'react';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught crash error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon-wrapper">
              <AlertOctagon size={40} />
            </div>
            <h1 className="error-boundary-title">Aplikasi Mengalami Kendala</h1>
            <p className="error-boundary-desc">
              Terjadi kesalahan sistem yang tidak terduga saat memuat halaman ini. Kami telah mencatat kejadian ini.
            </p>

            <details className="error-boundary-details">
              <summary>Detail Diagnostik Masalah</summary>
              <pre>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>

            <div className="error-boundary-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={this.handleGoHome}
              >
                <Home size={16} />
                <span>Ke Beranda</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={this.handleReload}
              >
                <RotateCw size={16} />
                <span>Muat Ulang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
