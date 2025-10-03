import Link from "next/link";
import "../Style/captain_sidebar.css";

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
        <Link href="/player/my-teams" className="sidebar-link">My Teams</Link>
        <Link href="/player/my-games" className="sidebar-link">My Games</Link>
        <Link href="/favourites" className="sidebar-link">Favourites</Link>
        <Link href="/captain/create-tournaments" className="sidebar-link">Create Tournament</Link>
        <Link href="/captain/my-tournaments" className="sidebar-link">My Tournaments</Link>
        <Link href="/captain/fixture" className="sidebar-link">Fixtures</Link>
        <Link href="/captain/conduct-match" className="sidebar-link">Conduct Matches</Link>
      </nav>
    </aside>
  );
}