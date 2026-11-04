import { Link, Route, Routes } from 'react-router';
import { TicketDetails } from './pages/TicketDetails.tsx';
import { TicketList } from './pages/TicketList.tsx';

export function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-icon" aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </span>
            <span className="brand-title">SupportDesk</span>
          </Link>
          <div className="header-meta">
            <span className="header-status-badge">
              <span className="status-dot" aria-hidden="true" />
              Support Portal
            </span>
          </div>
        </div>
      </header>
      <div className="app-main">
        <Routes>
          <Route path="/" element={<TicketList />} />
          <Route path="/tickets" element={<TicketList />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route
            path="*"
            element={
              <main className="page">
                <div className="not-found-card">
                  <div className="not-found-code">404</div>
                  <h2>Page Not Found</h2>
                  <p>Page not found.</p>
                  <Link to="/" className="btn btn-primary">
                    Go to tickets
                  </Link>
                </div>
              </main>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
