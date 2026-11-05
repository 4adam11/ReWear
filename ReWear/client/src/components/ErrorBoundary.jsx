import { Component } from "react";
import { Link } from "react-router-dom";
import usePageTitle from "../hooks/usePageTitle";

// Shows a friendly message instead of a blank page if something on a page crashes
export const ProblemPage = ({ title, text, action }) => (
  <div className="max-w-md mx-auto px-4 py-24 text-center">
    <h1 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">{title}</h1>
    <p className="mt-2 text-sm text-muted">{text}</p>
    <div className="mt-6">{action}</div>
  </div>
);

export const NotFound = () => {
  usePageTitle("Page not found");
  return (
  <ProblemPage
    title="We couldn't find that page"
    text="The link may be broken, or the page may have been removed."
    action={
      <Link to="/" className="btn btn-dark">
        Go to the home page
      </Link>
    }
  />
  );
};

class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  componentDidUpdate(prev) {
    // Moving to another page clears the error
    if (this.state.failed && prev.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <ProblemPage
        title="Something went wrong"
        text="This page ran into a problem. Please try again."
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn btn-dark"
          >
            Reload the page
          </button>
        }
      />
    );
  }
}

export default ErrorBoundary;
