import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/blog.css";

function Blog() {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const categories = [
        "Team Building",
        "Fundraising",
        "Strategy",
        "Product",
        "Leadership",
        "Founder Stories"
    ];

    const blogPosts = [
        {
            title: "5 Signs You've Found Your Ideal Co-Founder",
            category: "Team Building",
            date: "Feb 15, 2026",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
            excerpt: "Compatibility goes beyond skills. Discover the psychological markers of a long-term partnership."
        },
        {
            title: "How to Split Equity Without Losing Friends",
            category: "Strategy",
            date: "Feb 10, 2026",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800",
            excerpt: "Standard 50/50 isn't always fair. Learn about dynamic equity split models for early stage teams."
        },
        {
            title: "From Garage to Series A: A Founder's Story",
            category: "Founder Stories",
            date: "Feb 05, 2026",
            readTime: "12 min read",
            image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800",
            excerpt: "Sarah Jenkins shares her raw journey of building 'EcoConnect' and the pivotal role her co-founder played."
        },
        {
            title: "Pitching Your Vision: What VCs Actually Look For",
            category: "Fundraising",
            date: "Jan 28, 2026",
            readTime: "10 min read",
            image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800",
            excerpt: "It's not just the market size. Leading investors explain why the team is their #1 priority."
        }
    ];

    return (
        <div className="blog-page-wrapper">
            {/* Navbar */}
            <nav className="blog-nav">
                <div className="nav-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Cofounder.</div>
                <div className="nav-back">
                    <button className="btn-ghost" onClick={() => navigate("/")}>← Back to Home</button>
                </div>
            </nav>

            <main className="blog-main-content">
                <header className="blog-header">
                    <span className="blog-tag">Knowledge Hub</span>
                    <h1 className="blog-title">Founders Blog</h1>
                    <div className="title-underline"></div>
                    <p className="blog-intro">
                        The blog serves as a knowledge hub for founders and entrepreneurs.
                        It features articles on choosing the right co-founder, building balanced startup teams,
                        managing founder conflicts, fundraising strategies, product development,
                        and leadership growth.
                    </p>
                </header>

                <div className="blog-categories">
                    {categories.map((cat, i) => (
                        <span key={i} className="category-pill">{cat}</span>
                    ))}
                </div>

                <section className="blog-featured-section">
                    <div className="featured-card">
                        <div className="featured-image">
                            <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1200" alt="Featured" />
                        </div>
                        <div className="featured-content">
                            <span className="featured-label">Featured Article</span>
                            <h2>The Psychology of Partnership: Why Team Formation Fails</h2>
                            <p>
                                Dive deep into the expert insights that help users avoid common mistakes
                                and make informed decisions during their startup journey. Learn how to
                                build trust before committing.
                            </p>
                            <button className="btn-read">Read Full Article →</button>
                        </div>
                    </div>
                </section>

                <div className="blog-grid">
                    {blogPosts.map((post, i) => (
                        <article key={i} className="blog-card">
                            <div className="card-image">
                                <img src={post.image} alt={post.title} />
                                <span className="card-category">{post.category}</span>
                            </div>
                            <div className="card-content">
                                <div className="card-meta">
                                    <span>{post.date}</span>
                                    <span className="dot"></span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h3>{post.title}</h3>
                                <p>{post.excerpt}</p>
                                <a href="#read" className="read-link">Read More</a>
                            </div>
                        </article>
                    ))}
                </div>

                <section className="founder-stories-promo">
                    <div className="promo-content">
                        <h2>Real-world founder stories</h2>
                        <p>
                            We publish lessons learned from successful startups to help you
                            navigate the complexities of building a business together.
                            Authentic, raw, and highly educational.
                        </p>
                        <button className="btn-secondary">Explore Stories</button>
                    </div>
                </section>
            </main>

            <footer className="blog-footer">
                <div className="footer-newsletter">
                    <h3>Get founder insights in your inbox</h3>
                    <div className="newsletter-form">
                        <input type="email" placeholder="Enter your email" />
                        <button className="btn-primary">Subscribe</button>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 Cofounder Matching Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default Blog;
