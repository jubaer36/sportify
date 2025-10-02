"use client";

import "./profile.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
    userId: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    role: string;
    profilePhoto: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile>({
        userId: 0,
        name: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        profilePhoto: "",
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("http://localhost:8090/api/users/profile", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to fetch profile");
            }

            const data = await res.json();
            setProfile(data);
            setPreviewImage(data.profilePhoto);
        } catch (error) {
            console.error("Error fetching profile:", error);
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
        setError(null);
        setSuccess(null);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreviewImage(result);
                setProfile({ ...profile, profilePhoto: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            const res = await fetch("http://localhost:8090/api/users/profile", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    address: profile.address,
                    profilePhoto: profile.profilePhoto,
                }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    router.push("/login");
                    return;
                }
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            const updatedProfile = await res.json();
            setProfile(updatedProfile);
            setSuccess("Profile updated successfully!");
        } catch (error: any) {
            setError(error.message || "Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                    <p>Update your personal information</p>
                </div>

                <form className="profile-form" onSubmit={handleSubmit}>
                    {/* Profile Photo Section */}
                    <div className="photo-section">
                        <div className="photo-container">
                            {previewImage ? (
                                <Image
                                    src={previewImage}
                                    alt="Profile"
                                    width={120}
                                    height={120}
                                    className="profile-image"
                                />
                            ) : (
                                <div className="photo-placeholder">
                                    <span>No Photo</span>
                                </div>
                            )}
                        </div>
                        <div className="photo-controls">
                            <input
                                type="file"
                                id="profilePhoto"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="file-input"
                            />
                            <label htmlFor="profilePhoto" className="photo-btn">
                                Change Photo
                            </label>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={profile.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={profile.phone || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <input
                                type="text"
                                id="role"
                                name="role"
                                value={profile.role}
                                disabled
                                className="disabled-field"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="address">Address</label>
                            <textarea
                                id="address"
                                name="address"
                                value={profile.address || ""}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter your full address"
                            />
                        </div>
                    </div>

                    {/* Messages */}
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="update-btn"
                            disabled={updating}
                        >
                            {updating ? "Updating..." : "Update Profile"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}