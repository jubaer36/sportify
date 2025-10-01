'use client';

import React, { useEffect, useState } from "react";
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./notifications.css";

interface Notification {
  notificationId: number;
  recipientId: number;
  recipientName: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [key: number]: boolean }>({});
  const [userId, setUserId] = useState<number | null>(null);

  // Get current user profile (to get userId)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8090/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserId(data.userId);
        }
      } catch (error) {
        setUserId(null);
      }
    };
    fetchProfile();
  }, []);

  // Fetch notifications for current user
  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await makeAuthenticatedRequest<Notification[]>(
          `/api/notifications/user/${userId}`
        );
        if (res.error) {
          setError(res.error);
          setNotifications([]);
        } else {
          setNotifications(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        setError("Failed to load notifications.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [userId]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    await makeAuthenticatedRequest<Notification>(
      `/api/notifications/${notificationId}/read`,
      { method: "PUT" }
    );
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
  };

  // Toggle dropdown for message
  const handleToggle = (notification: Notification) => {
    setExpanded((prev) => ({
      ...prev,
      [notification.notificationId]: !prev[notification.notificationId],
    }));
    if (!notification.isRead) {
      markAsRead(notification.notificationId);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="notifications-bg">
      <Topbar />
      <div className="notifications-content">
        <h1 className="notifications-title">Notifications</h1>
        {loading ? (
          <div className="loading-message">Loading notifications...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications-message">No notifications found.</div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`notification-card${notification.isRead ? " read" : ""}`}
                onClick={() => handleToggle(notification)}
              >
                <div className="notification-row">
                  <span className="notification-date">{formatDate(notification.sentAt)}</span>
                  <span className="notification-status-logo">
                    <img
                      src={
                        notification.isRead
                          ? "/Photos/notification_read.png"
                          : "/Photos/notification_unread.png"
                      }
                      alt={notification.isRead ? "Read" : "Unread"}
                      className="status-logo"
                    />
                  </span>
                </div>
                <div className="notification-summary">
                  <span>
                    {notification.isRead ? "Already viewed" : "New Message !"}
                  </span>
                </div>
                {expanded[notification.notificationId] && (
                  <div className="notification-message-dropdown">
                    <div className="notification-message">{notification.message}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}