import { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "../../utils/axiosConfig";
import AlertMessage from "./AlertMessage";
import StatusBox from "./StatusBox";
import ProfileHeader from "./ProfileHeader";
import PortfolioSection from "./PortfolioSection";
import LinksSection from "./LinksSection";
import ContactSection from "./ContactSection";
import RatingForm from "./RatingForm";
import ProfileUpdateForm from "./ProfileUpdateForm";
import "./Profile.css";

const socket = io(process.env.REACT_APP_SOCKET_URL || "http://localhost:5000", {
  transports: ["websocket", "polling"],
});

const Profile = () => {
  const [user, setUser] = useState({
    name: "",
    role: "",
    picture: "",
    headline: "",
    serviceType: "",
    businessRegNumber: "",
    videoUrl: "",
    averageRating: 0,
    _id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [headline, setHeadline] = useState("");
  const [portfolio, setPortfolio] = useState([
    { title: "", image: "", description: "" },
    { title: "", image: "", description: "" },
  ]);
  const [links, setLinks] = useState({
    portfolio: "",
    socialMedia: { twitter: "", linkedin: "", instagram: "" },
    email: "",
  });
  const [contact, setContact] = useState({ address: "", phone: "" });
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const res = await axios.get("/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.data) throw new Error("No profile data received");

      setUser({
        name: res.data.name || "",
        role: res.data.role || "",
        picture: res.data.picture || "/default-profile.png",
        headline: res.data.headline || "",
        serviceType: res.data.serviceType || "",
        businessRegNumber: res.data.businessRegNumber || "",
        videoUrl: res.data.videoUrl || "",
        averageRating: res.data.averageRating || 0,
        _id: res.data._id || "",
      });

      setHeadline(res.data.headline || "");
      setPortfolio(res.data.portfolio || []);
      setLinks(
        res.data.links || {
          portfolio: "",
          socialMedia: { twitter: "", linkedin: "", instagram: "" },
          email: res.data.email || "",
        }
      );
      setContact(res.data.contact || { address: "", phone: "" });
      setIsOnline(res.data.isOnline || false);
      setLoading(false);
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError(err.response?.data?.message || "Failed to load profile");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();

    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("setOnline", userId);
      socket.on("statusUpdate", ({ userId: updatedUserId, isOnline }) => {
        if (updatedUserId === user?._id) setIsOnline(isOnline);
      });

      return () => {
        socket.emit("setOffline", userId);
        socket.off("statusUpdate");
      };
    }
  }, [fetchProfile, user?._id]);

  const handlePictureUpdate = (newPicture) => {
    setUser((prev) => ({
      ...prev,
      picture: newPicture
        ? `${
            process.env.REACT_APP_API_URL || "http://localhost:5000"
          }${newPicture}`
        : prev.picture,
    }));
    setSuccess("Profile picture updated!");
  };

  if (loading) return <Spinner animation="border" className="mt-5" />;
  if (error && !user) return <AlertMessage variant="danger" message={error} />;

  return (
    <Container className="profile-container py-5">
      <Row>
        <Col md={3} className="sidebar">
          <StatusBox isOnline={isOnline} />
        </Col>

        <Col md={9}>
          <h2 className="profile-title">{user.name}'s Profile</h2>

          {error && (
            <AlertMessage
              variant="danger"
              message={error}
              onClose={() => setError("")}
            />
          )}
          {success && (
            <AlertMessage
              variant="success"
              message={success}
              onClose={() => setSuccess("")}
            />
          )}

          <ProfileHeader user={user} onPictureUpdate={handlePictureUpdate} />

          {user.role === "professional" && user.videoUrl && (
            <>
              <h3 className="section-title">Showcase Video</h3>
              <div className="video-section">
                <video controls className="w-full rounded-lg">
                  <source src={user.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </>
          )}

          {user.role === "professional" && (
            <>
              <PortfolioSection portfolio={portfolio} />
              <LinksSection links={links} />
              <ContactSection contact={contact} />
            </>
          )}

          {user.role === "customer" && <RatingForm userId={user._id} />}

          <ProfileUpdateForm
            user={user}
            headline={headline}
            setHeadline={setHeadline}
            portfolio={portfolio}
            setPortfolio={setPortfolio}
            links={links}
            setLinks={setLinks}
            contact={contact}
            setContact={setContact}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
