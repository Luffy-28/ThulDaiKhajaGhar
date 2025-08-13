import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/logo.svg";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 If redirected from cart, go back to /order after signup
  const redirectTo = (location.state as { redirectTo?: string })?.redirectTo || "/";

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        name,
        role: "user",
        points: 0,
      });
      toast.success("Signup successful! Please check your email to verify your account.");
      navigate("/login", { state: { redirectTo } });
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F5] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-[#F5F6F5] rounded-xl shadow-xl p-8 border border-[#4682B4]/20">
        <img
          src={logo}
          alt="App Logo"
          className="mx-auto h-26 w-auto mb-6 mix-blend-multiply"
        />
        <h2 className="text-3xl font-extrabold text-[#FF2400] text-center mb-6">Create Account</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-[#FF2400] px-4 py-2 text-[#F5F6F5] font-semibold hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-6 text-center text-[#0A5C36]">
          <p>Already have an account?</p>
          <Link
            to="/login"
            state={{ redirectTo }}
            className="text-[#4682B4] font-medium hover:text-[#FF2400] hover:underline transition-all duration-300"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}