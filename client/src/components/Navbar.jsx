import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  ["/dashboard", "Dashboard"],
  ["/clients", "Clients"],
  ["/items", "Items"],
  ["/quotations", "Quotations"],
  ["/invoices", "Invoices"],
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/");
  }

  const nav = links.map(([to, label]) => (
    <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : undefined)}>
      {label}
    </NavLink>
  ));

  return (
    <>
      <aside className="side">
        <div style={{ padding: "0.4rem 0.8rem 1.2rem" }}>
          <p className="kicker">QuoteFlow</p>
          <p className="display" style={{ fontSize: "1.6rem", margin: "0.4rem 0 0" }}>
            Y Labs
          </p>
          <p className="muted" style={{ margin: "0.2rem 0 0" }}>
            Software & Security Solutions
          </p>
        </div>
        <nav>{nav}</nav>
        <div className="side-foot">
          <strong>{user?.name}</strong>
          <p className="muted" style={{ margin: 0, textTransform: "capitalize" }}>
            {user?.role}
          </p>
          <button className="btn ghost" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <p className="kicker">QuoteFlow</p>
            <strong>Y Labs</strong>
          </div>
          <button className="btn ghost" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
        <nav className="topnav">{nav}</nav>
      </div>
    </>
  );
}
