import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LayoutWithNav from "./components/LayoutWithNav";
import Login from "./components/Login";
import Signup from "./components/Signup";
import HomePage from "./components/Hero";
import MenuPage from "./components/MenuHighLights";
import CartPage from "./components/Cart";
import ContactPage from "./components/Contact";
import AdminOrders from "./components/admin/AdminOrder";
import AdminItemPanel from "./components/admin/AdminPanel";
import AdminAnalysis from "./components/admin/AdminAnalysis";
import ProfilePage from "./components/ProfilePage";
import AdminManageUsers from "./components/admin/AdminManageUsers";
import { useUserTheme } from "./hooks/useUserTheme";
import CheckoutForm from "./components/Checkout";
import Done from "./components/Done";
import MenuDetails from "./components/MenuDetials";

export default function AppRouter() {
   useUserTheme();
  return (
    
    <Router>
      <Routes>
        {/* 👇 Default redirect to home (instead of forcing login) */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* 🔑 Auth pages (no navbar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 📌 Main layout with navbar */}
        <Route element={<LayoutWithNav />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/menu/:id" element={<MenuDetails />} />
           <Route path="/profile" element={<ProfilePage />} />
          <Route path="/done" element={<Done />} />
           <Route path="/Checkout" element={<CheckoutForm />} />

          {/* 👨‍💻 Admin routes */}
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/panel" element={<AdminItemPanel />} />
          <Route path="/admin/analysis" element={<AdminAnalysis />} />
          <Route path="/admin/profile" element={<AdminManageUsers />} />

        </Route>
      </Routes>
    </Router>
  );
}
