import { Component } from "react";

// Keeps a crash in one part of the page from blanking the whole app
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div dir="rtl" style={{ padding: 24, textAlign: "center" }}>
        <h2>משהו השתבש</h2>
        <button onClick={() => window.location.reload()}>לטעון מחדש</button>
      </div>
    );
  }
}
