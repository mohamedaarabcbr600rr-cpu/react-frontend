import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./services/api";

export default function AdminLogin({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const res = await api.post("/admin/login", {
        email,
        password,
      });

      // save token
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);

      // redirect to dashboard
      navigate("/admin");

    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", marginTop: "100px" }}>
      <h2>Admin Login</h2>

      <form onSubmit={login}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}






