import Link from "next/link";
import Image from "next/image";
import "../Style/topbar.css";

export default function Topbar() {
  return (
    <nav className="topbar">
      <div className="nav-left">
        <Link href="/admin/dashboard" className="nav-btn">Ongoing events</Link>
        <Link href="/admin/dashboard?tab=upcoming" className="nav-btn">Upcoming events</Link>
        <Link href="/admin/dashboard?tab=history" className="nav-btn">History</Link>
        <Link href="/admin/dashboard?tab=tournaments" className="nav-btn">Tournaments</Link>
      </div>
      <div className="nav-right">
        <Link href="/admin/profile">
          <Image
            src="/Photos/logo3.png"
            alt="Profile"
            width={38}
            height={38}
            className="profile-logo"
          />
        </Link>
      </div>
    </nav>
  );
}