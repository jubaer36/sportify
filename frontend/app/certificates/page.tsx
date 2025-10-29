'use client';

import React, { useEffect, useState } from 'react';
import Topbar from "@/Component/topbar";
import { makeAuthenticatedRequest } from "@/utils/api";
import "./certificates.css";

type Certificate = {
    id: number;
    recipientName: string;
    tournamentName: string;
    sportName: string;
    position: 'Champion' | 'Runner-up' | 'Semifinalist' | 'Participant';
    date: string; // ISO
};

const demoCertificates: Certificate[] = [
    {
        id: 1,
        recipientName: 'John Doe',
        tournamentName: 'Inter University Badminton 2025',
        sportName: 'Badminton',
        position: 'Champion',
        date: new Date().toISOString(),
    },
    {
        id: 2,
        recipientName: 'Jane Smith',
        tournamentName: 'Spring Chess Open 2025',
        sportName: 'Chess',
        position: 'Runner-up',
        date: new Date().toISOString(),
    },
];

function formatDate(dateIso: string) {
    const d = new Date(dateIso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CertificatesPage() {
    const [certs, setCerts] = useState<Certificate[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                // fetch profile to get userId
                const profileRes = await fetch("http://localhost:8090/api/users/profile", {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (!profileRes.ok) throw new Error('Failed to load profile');
                const profile = await profileRes.json();
                const userId = profile?.userId;
                if (!userId) throw new Error('No user id');

                const res = await makeAuthenticatedRequest<any>(`/api/certificates/user/${userId}`);
                const items = (res.data || []).map((c: any) => ({
                    id: c.certificateId,
                    recipientName: c.userName,
                    tournamentName: c.tournamentName,
                    sportName: c.sportName,
                    position: (c.position || 'Participant') as Certificate['position'],
                    date: c.issuedOn,
                }));
                setCerts(items);
            } catch (e: any) {
                setError(e.message || 'Failed to load certificates');
                setCerts(demoCertificates); // fallback to demo
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const data = certs ?? demoCertificates;

    return (
        <div className="certificates-page">
            <Topbar />
            <div className="certificates-container">
                <h1 className="certificates-title">My Certificates</h1>
                <p className="certificates-subtitle">Digital certificates for your achievements. PDF download coming soon.</p>

                {loading && <p style={{textAlign:'center', color:'#64748b'}}>Loading...</p>}
                {error && <p style={{textAlign:'center', color:'#dc2626'}}>{error}</p>}

                <div className="certificates-grid">
                    {data.map(cert => (
                        <div key={cert.id} className="certificate-wrapper">
                            <div className={`certificate ${cert.position.toLowerCase()}`}>
                                <div className="certificate-border">
                                    <div className="certificate-header">
                                        <img src="/Photos/logo1.png" alt="Organization Logo" className="certificate-logo" onError={(e) => { (e.target as HTMLImageElement).src = '/Photos/logo1.png'; }} />
                                        <div className="header-text">
                                            <h2>Sportify Athletics Board</h2>
                                            <span className="header-sub">Certificate of Achievement</span>
                                        </div>
                                    </div>

                                    <div className="certificate-body">
                                        <div className="decor-line" />
                                        <div className="presented-to">Presented to</div>
                                        <div className="recipient-name">{cert.recipientName}</div>
                                        <div className="reason">
                                            for outstanding performance as <strong>{cert.position}</strong> in
                                            <span className="tournament"> {cert.tournamentName}</span>
                                            <span className="sport"> ({cert.sportName})</span>
                                        </div>
                                        <div className="decor-line" />

                                        <div className="meta-row">
                                            <div className="meta">
                                                <div className="meta-label">Issued on</div>
                                                <div className="meta-value">{formatDate(cert.date)}</div>
                                            </div>
                                            <div className="meta qr">
                                                <div className="qr-box">QR</div>
                                                <div className="meta-hint">Verify</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="certificate-footer">
                                        <div className="signature">
                                            <div className="sig-line" />
                                            <div className="sig-name">Tournament Director</div>
                                        </div>
                                        <div className="seal">Official Seal</div>
                                        <div className="signature">
                                            <div className="sig-line" />
                                            <div className="sig-name">Head of Sports</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="certificate-actions">
                                <button className="btn-outline" disabled>Download PDF (soon)</button>
                                <button className="btn-primary" disabled>Share (soon)</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


