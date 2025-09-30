import Link from "next/link";
import "./sidebar.css";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
        ×
      </button>
      <nav className="sidebar-nav">
        <Link href="/admin/profile" className="sidebar-link">My Profile</Link>
        <Link href="/admin/teams" className="sidebar-link">Manage Teams</Link>
        <Link href="/admin/all-games" className="sidebar-link">All Games</Link>
        <Link href="/admin/dashboard" className="sidebar-link">Dashboard</Link>
      </nav>
    </aside>
  );
}