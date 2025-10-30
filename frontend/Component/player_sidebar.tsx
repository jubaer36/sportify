import Link from "next/link";
import "../Style/player_sidebar.css";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function PlayerSidebar({ open, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">
        ×
      </button>
      <nav className="sidebar-nav">
        <Link href="/profile" className="sidebar-link">My Profile</Link>
        <Link href="/player/my-teams" className="sidebar-link">My Teams</Link>
        <Link href="/player/my-games" className="sidebar-link">My Games</Link>
        <Link href="/player/view-match-result" className="sidebar-link">View Match Result</Link>
      </nav>
    </aside>
  );
}