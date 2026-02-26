import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/help-center.css";

function HelpCenter() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Auto-fill email if logged in
        const userEmail = sessionStorage.getItem("userEmail");
        const userName = sessionStorage.getItem("loggedInUser");

        if (userEmail) {
            setFormData(prev => ({
                ...prev,
                email: userEmail,
                name: userName || ""
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userId = sessionStorage.getItem("userEmail") || "anonymous";

            await addDoc(collection(db, "helpMessages"), {
                ...formData,
                userId: userId,
                timestamp: serverTimestamp(),
                status: "unread"
            });

            setSubmitted(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="help-center-wrapper">
                <div className="help-container">
                    <div className="success-message">
                        <h3>🎉 Message Sent Successfully!</h3>
                        <p>Thank you for reaching out. Our team will get back to you shortly.</p>
                    </div>
                    <button className="send-btn" onClick={() => setSubmitted(false)}>Send Another Message</button>
                    <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="back-link">Return to Home</a>
                </div>
            </div>
        );
    }

    return (
        <div className="help-center-wrapper">
            <div className="help-container">
                <div className="help-header">
                    <h1>Help Center</h1>
                    <p>How can we assist you today?</p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Registered Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            placeholder="What's this about?"
                            required
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Message</label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Write your message here..."
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className="send-btn" disabled={loading}>
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </form>

                <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="back-link">← Back to Home</a>
            </div>
        </div>
    );
}

export default HelpCenter;
