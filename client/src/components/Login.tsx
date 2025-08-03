import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate, Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 check if we were redirected here from checkout
  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || "/home";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          navigate("/admin/orders");
        } else {
          navigate(redirectTo); // ✅ go to redirect target
        }
      }
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="App Logo" className="auth-logo" />
      <h2 className="auth-title">Welcome Back</h2>
      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="auth-input"
        />
        <button type="submit" className="auth-button">
          Log In
        </button>
      </form>
      <div className="auth-footer">
        <p>Don’t have an account?</p>
        <Link to="/signup" state={{ redirectTo }}>
          Create Account
        </Link>
      </div>
    </div>
  );
}
