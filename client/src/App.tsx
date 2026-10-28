import { Link, Route, Routes } from 'react-router';
import { TicketDetails } from './pages/TicketDetails.tsx';
import { TicketList } from './pages/TicketList.tsx';

export function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="brand">
          SupportDesk
        </Link>
      </header>
      <Routes>
        <Route path="/" element={<TicketList />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route
          path="*"
          element={
            <main className="page">
              <p>Page not found.</p>
              <Link to="/">Go to tickets</Link>
            </main>
          }
        />
      </Routes>
    </>
  );
}
