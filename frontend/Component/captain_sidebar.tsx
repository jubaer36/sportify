import Link from "next/link";
import "./captain_sidebar.css";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function CaptainSidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
        ×
      </button>
      <nav className="sidebar-nav">
        <Link href="/profile" className="sidebar-link">My Profile</Link>
        <Link href="/teams" className="sidebar-link">My Teams</Link>
        <Link href="/games" className="sidebar-link">My Games</Link>
        <Link href="/favourites" className="sidebar-link">Favourites</Link>
        <Link href="/create-tournament" className="sidebar-link">Create Tournament</Link>
        <Link href="/fixtures" className="sidebar-link">Fixtures</Link>
      </nav>
    </aside>
  );
}