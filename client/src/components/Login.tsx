import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/logo.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { redirectTo = "/home", cartItems, total } = location.state || {};

  // Handle already authenticated users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (!user.emailVerified) {
          toast.error("Please verify your email before logging in.");
          await auth.signOut();
          return;
        }
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === "admin") {
            navigate("/admin/orders");
          } else {
            navigate(redirectTo, { state: { cartItems, total } });
          }
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, redirectTo, cartItems, total]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      if (!userCred.user.emailVerified) {
        toast.error("Please verify your email before logging in.");
        await auth.signOut();
        return;
      }
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === "admin") {
          navigate("/admin/orders");
        } else {
          navigate(redirectTo, { state: { cartItems, total } });
        }
      }
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Please check your inbox.");
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
        <h2 className="text-3xl font-extrabold text-[#71180a] text-center mb-6">Welcome Back</h2>
        <form onSubmit={handleLogin} className="space-y-4">
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
            Log In
          </button>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full rounded-md border border-[#4682B4] px-4 py-2 text-[#0A5C36] font-medium hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
          >
            Forgot Password?
          </button>
        </form>
        <div className="mt-6 text-center text-[#0A5C36]">
          <p>Don’t have an account?</p>
          <Link
            to="/signup"
            state={{ redirectTo, cartItems, total }}
            className="text-[#4682B4] font-medium hover:text-[#FF2400] hover:underline transition-all duration-300"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}