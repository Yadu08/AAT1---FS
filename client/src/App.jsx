import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import Clients from "./pages/Clients";
import Dashboard from "./pages/Dashboard";
import InvoiceView from "./pages/InvoiceView";
import Invoices from "./pages/Invoices";
import Items from "./pages/Items";
import Login from "./pages/Login";
import QuotationForm from "./pages/QuotationForm";
import Quotations from "./pages/Quotations";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="page muted">Opening the books…</p>;
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="shell">
      <Navbar />
      <main className="page">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/clients" element={<Protected><Clients /></Protected>} />
      <Route path="/items" element={<Protected><Items /></Protected>} />
      <Route path="/quotations" element={<Protected><Quotations /></Protected>} />
      <Route path="/quotations/new" element={<Protected><QuotationForm /></Protected>} />
      <Route path="/quotations/:id" element={<Protected><QuotationForm /></Protected>} />
      <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
      <Route path="/invoices/:id" element={<Protected><InvoiceView /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
