import { useState, useEffect } from "react";
import axios from "../utils/axiosConfig";
import { Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import io from "socket.io-client";
import ProfileHeader from "../components/profile/ProfileHeader";
import PortfolioSection from "../components/profile/PortfolioSection";
import LinksSection from "../components/profile/LinksSection";
import ContactSection from "../components/profile/ContactSection";
import ProfileUpdateForm from "../components/profile/ProfileUpdateForm";
import "../components/profile/Profile.css";

// ✅ Fix: Use dynamic WebSocket URL based on environment
const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
});

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view your profile");
          setLoading(false);
          return;
        }
        const res = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setIsOnline(res.data.isOnline);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!user) return;

    socket.emit("setOnline", user._id);
    socket.on("statusUpdate", ({ userId, isOnline }) => {
      if (userId === user._id) setIsOnline(isOnline);
    });

    return () => {
      socket.emit("setOffline", user._id);
      socket.off("statusUpdate");
    };
  }, [user]);

  const handleUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handlePictureUpdate = (newPictureUrl) => {
    setUser((prev) => ({ ...prev, picture: newPictureUrl }));
  };

  if (loading)
    return <Spinner animation="border" className="mt-5 mx-auto d-block" />;

  if (!user && error) return <Alert variant="danger">{error}</Alert>;

  if (!user) return <div>Loading...</div>;

  const isProfessional = user.role === "professional";

  return (
    <Container className="profile-container py-5">
      <Row>
        <Col md={3} className="sidebar">
          <div className="status-box">
            <h4>Status</h4>
            <div
              className={`status-indicator ${isOnline ? "online" : "offline"}`}
            >
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </Col>
        <Col md={9}>
          <h2 className="profile-title">Your Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}

          <ProfileHeader user={user} onPictureUpdate={handlePictureUpdate} />

          {isProfessional && user.videoUrl && (
            <>
              <h3 className="section-title">Showcase Video</h3>
              <div className="video-section">
                <video
                  controls
                  className="w-100 rounded-lg"
                  style={{ maxHeight: "400px" }}
                >
                  <source
                    src={`${
                      process.env.REACT_APP_API_URL || "http://localhost:5000"
                    }${user.videoUrl}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </>
          )}

          <ProfileUpdateForm
            user={user}
            onUpdate={handleUpdate}
            isProfessional={isProfessional}
          />

          {isProfessional && (
            <>
              <PortfolioSection portfolio={user.portfolio} />
              <LinksSection links={user.links} />
              <ContactSection contact={user.contact} />
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Profile;
