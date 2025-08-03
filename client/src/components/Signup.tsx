import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 if redirected from cart, go back to /order after signup
  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        name,
        role: "user",
        points: 0,
      });
      alert("✅ Signup successful!");
      navigate(redirectTo); // ✅ go to redirect target
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="App Logo" className="auth-logo" />
      <h2 className="auth-title">Create Account</h2>
      <form onSubmit={handleSignup} className="auth-form">
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="auth-input"
        />
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
          Sign Up
        </button>
      </form>
      <div className="auth-footer">
        <p>Already have an account?</p>
        <Link to="/login" state={{ redirectTo }}>
          Log In
        </Link>
      </div>
    </div>
  );
}
