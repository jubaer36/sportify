import Link from "next/link";
import "../Style/sidebar.css";

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
        <Link href="/profile" className="sidebar-link">My Profile</Link>
        <Link href="/admin/manage-captains" className="sidebar-link">Manage Captains</Link>
        <Link href="/admin/all-games" className="sidebar-link">All Games</Link>
      </nav>
    </aside>
  );
}