import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../utils/axiosConfig";
import { Container, Row, Col, Alert, Button, Spinner } from "react-bootstrap";
import io from "socket.io-client";
import ReactStars from "react-rating-stars-component";
import ProfileHeader from "../components/profile/ProfileHeader";
import PortfolioSection from "../components/profile/PortfolioSection";
import LinksSection from "../components/profile/LinksSection";
import ContactSection from "../components/profile/ContactSection";
import "../components/profile/Profile.css";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

function ProfessionalProfile() {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to view this profile");
          setLoading(false);
          return;
        }
        const res = await axios.get(`/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfessional(res.data);
        setIsOnline(res.data.isOnline);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load professional");
      } finally {
        setLoading(false);
      }
    };

    fetchProfessional();

    socket.on("statusUpdate", ({ userId, isOnline }) => {
      if (userId === id) setIsOnline(isOnline);
    });

    return () => socket.off("statusUpdate");
  }, [id]);

  const handleMessageClick = () => {
    navigate("/messages", {
      state: { recipientId: id, recipientName: professional.name },
    });
  };

  const handleRating = async (newRating) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/users/${id}/rate`,
        { score: newRating, comment: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRating(newRating);
      alert("Rating submitted!");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit rating");
    }
  };

  if (loading) return <Spinner animation="border" className="mt-5 mx-auto" />;
  if (!professional && error) return <Alert variant="danger">{error}</Alert>;
  if (!professional) return <div>Loading...</div>;

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
          <Button
            className="message-button w-100 mt-3"
            onClick={handleMessageClick}
          >
            Message {professional.name}
          </Button>
          <div className="mt-3">
            <h4>Rate {professional.name}</h4>
            <ReactStars
              count={5}
              value={rating || professional.averageRating}
              onChange={handleRating}
              size={24}
              activeColor="#ffd700"
            />
          </div>
        </Col>
        <Col md={9}>
          <h2 className="profile-title">{professional.name}'s Profile</h2>
          {error && <Alert variant="danger">{error}</Alert>}

          <ProfileHeader user={professional} />

          {professional.videoUrl && (
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
                    }${professional.videoUrl}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </>
          )}

          <PortfolioSection portfolio={professional.portfolio} />
          <LinksSection links={professional.links} />
          <ContactSection contact={professional.contact} />
        </Col>
      </Row>
    </Container>
  );
}

export default ProfessionalProfile;
