import React from "react";
import ErrorPage from "@pages/Error/ErrorPage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log error details for debugging
    if (typeof window !== "undefined" && window.console) {
      console.group("🚨 React Error Boundary");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleNavigate = (path) => {
    // Use window.location for navigation when Router context is not available
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          title="React Component Error"
          message="An unexpected error occurred in the application. We've been notified about this issue."
          showRetry={true}
          showHome={true}
          onNavigate={this.handleNavigate}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
