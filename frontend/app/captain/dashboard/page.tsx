import Topbar from "@/Component/topbar";
import "./captain_dashboard.css";

export default function CaptainDashboard() {
  return (
    <div className="captain-dashboard-bg">
      <Topbar />
      <div className="captain-dashboard-content">
        <h1 className="captain-dashboard-title">Welcome, Captain!</h1>
        <div className="captain-news-section">
          <h2>Latest News</h2>
          <ul>
            <li>
              <strong>Football Tournament 2025</strong> registration opens next week!
            </li>
            <li>
              <strong>Basketball Ongoing:</strong> Semi-finals scheduled for October 10th.
            </li>
            <li>
              <strong>New Feature:</strong> Player stats analytics now available for all admins.
            </li>
            <li>
              <strong>Maintenance:</strong> System update planned for October 15th, 2AM-4AM.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}