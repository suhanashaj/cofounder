import React, { useState, useEffect } from "react";
import { postFeedback, getFeedbacks } from "../utils/api";

function FeedbackSection({ startupId, currentUser, partners }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [newFeedback, setNewFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const isPartner = partners.includes(currentUser);

    useEffect(() => {
        const fetchFeedbacks = async () => {
            if (startupId) {
                const data = await getFeedbacks(startupId);
                setFeedbacks(data);
            }
        };
        fetchFeedbacks();
    }, [startupId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newFeedback.trim()) return;

        setLoading(true);
        const res = await postFeedback(startupId, currentUser, newFeedback);
        if (res.success) {
            setNewFeedback("");
            const data = await getFeedbacks(startupId);
            setFeedbacks(data);
        } else {
            alert(res.msg);
        }
        setLoading(false);
    };

    return (
        <div className="feedback-section" style={{ marginTop: "30px", padding: "20px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "16px", border: "1px solid var(--border-glass)" }}>
            <h3 style={{ marginBottom: "20px", fontSize: "1.2rem", color: "var(--accent-color)" }}>Startup Journey Feedback</h3>

            {isPartner && (
                <form onSubmit={handleSubmit} style={{ marginBottom: "30px" }}>
                    <textarea
                        value={newFeedback}
                        onChange={(e) => setNewFeedback(e.target.value)}
                        placeholder="Share your feedback or milestone..."
                        style={{
                            width: "100%",
                            padding: "15px",
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "12px",
                            color: "white",
                            minHeight: "100px",
                            marginBottom: "10px",
                            outline: "none"
                        }}
                    />
                    <button
                        type="submit"
                        className="action-btn"
                        disabled={loading}
                        style={{ width: "100%" }}
                    >
                        {loading ? "POSTING..." : "POST FEEDBACK"}
                    </button>
                </form>
            )}

            <div className="feedback-list">
                {feedbacks.length > 0 ? (
                    feedbacks.map((f, i) => (
                        <div key={i} style={{
                            padding: "15px",
                            background: "rgba(255, 255, 255, 0.02)",
                            border: "1px solid var(--border-glass)",
                            borderRadius: "12px",
                            marginBottom: "15px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                <span style={{ fontWeight: "700", color: "var(--accent-color)", fontSize: "0.9rem" }}>@{f.fromUser}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {f.timestamp ? new Date(f.timestamp.seconds * 1000).toLocaleDateString() : "Just now"}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-main)" }}>{f.text}</p>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>No feedbacks yet. Partners can start sharing their journey!</p>
                )}
            </div>
        </div>
    );
}

export default FeedbackSection;
