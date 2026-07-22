import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "../axios";

const AuthCallback = ({ setUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      navigate("/");
      return;
    }

    if (!token) {
      navigate("/");
      return;
    }

    localStorage.setItem("token", token);
    localStorage.removeItem("referral_code");

    axios.get("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setUser(res.data);
        navigate("/");
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{ textAlign: "center", padding: "100px 20px", color: "#666" }}>
      Connexion en cours...
    </div>
  );
};

export default AuthCallback;