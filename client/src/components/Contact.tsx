import React, { useState } from "react";
import { toast } from "react-toastify";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWhatsapp,
  faFacebookMessenger,
  faInstagram,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", reason: "", datetime: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        createdAt: new Date(),
        status: "pending",
      });
      toast.success("Inquiry submitted successfully!");
      setFormData({ name: "", email: "", phone: "", reason: "", datetime: "", message: "" });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6F5]">
      {/* Header */}
      <header className="bg-[#F5F6F5] border-b border-[#4682B4]/20">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-3xl font-extrabold text-[#FF2400]">Thul Dai Khaja Ghar</h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center rounded-md border border-[#4682B4] bg-[#F5F6F5] px-3 py-2 text-sm font-medium text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
            >
              📞 Order Hotline: 0451 995 722
            </button>

            <button
              className="inline-flex items-center justify-center rounded-md bg-[#FF2400] px-3 py-2 text-sm font-semibold text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              onClick={() => window.open("https://www.doordash.com/store/thul-dai-khaja-ghar-auburn...", "_blank")}
            >
              🛵 Delivery: DoorDash
            </button>

            <button
              className="inline-flex items-center justify-center rounded-md bg-[#FF2400] px-3 py-2 text-sm font-semibold text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              onClick={() => window.open("https://www.ubereats.com/au/store/thul-dai-khaja-ghar...", "_blank")}
            >
              🛵 Delivery: Uber
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Info Box */}
          <section className="rounded-xl bg-[#F5F6F5] p-6 shadow border border-[#4682B4]/20">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">Contact Information</h2>
            <div className="space-y-2 text-[#0A5C36]">
              <p>📞 0451 995 722</p>
              <p>📧 thuldaikhajaghar@gmail.com</p>
              <p>📍 212-214 Parramatta Road, Auburn 2144, NSW</p>
            </div>

            <h3 className="mt-6 text-lg font-semibold text-[#FF2400]">Opening Hours</h3>
            <p className="text-[#0A5C36]">🕐 Mon – Sun: 5:00 PM – 5:00 AM</p>

            <h3 className="mt-6 text-lg font-semibold text-[#FF2400]">Reservations</h3>
            <p className="text-[#0A5C36]">📅 For group or event bookings, call or use the form below.</p>
          </section>

          {/* Google Map */}
          <section className="rounded-xl overflow-hidden bg-[#F5F6F5] shadow border border-[#4682B4]/20">
            <iframe
              title="Google Map"
              src="https://www.google.com/maps?q=212-214+Parramatta+Road,+Auburn+2144,+NSW&output=embed"
              className="w-full h-[320px]"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </section>
        </div>

        {/* Contact Form */}
        <section className="mt-10 bg-[#F5F6F5] p-6 rounded-xl shadow border border-[#4682B4]/20">
          <h2 className="text-xl font-bold text-[#FF2400] mb-4">Reservation / Inquiry Form</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              required
            />
            <input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              required
            />
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 bg-[#F5F6F5] text-[#0A5C36] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              required
            >
              <option value="" className="text-[#4682B4]">Select Reason</option>
              <option value="Table Booking">Table Booking</option>
              <option value="Catering Inquiry">Catering Inquiry</option>
              <option value="Feedback">Feedback</option>
            </select>
            <input
              name="datetime"
              type="datetime-local"
              value={formData.datetime}
              onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
            />
            <textarea
              name="message"
              placeholder="Optional Message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full md:col-span-2 rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
            ></textarea>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-[#FF2400] px-5 py-2 text-[#F5F6F5] font-bold hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-lg transition-all duration-300"
              >
                📩 SUBMIT FORM
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Floating Social Icons */}
      <div className="fixed right-4 bottom-4 flex flex-col gap-3 z-50">
        <a
          href="https://wa.me/61451995722"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#FF2400] text-[#F5F6F5] shadow-lg hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-110 transition-all duration-300"
          title="Chat on WhatsApp"
        >
          <FontAwesomeIcon icon={faWhatsapp} size="lg" />
        </a>
        <a
          href="https://m.me/ThulDaiKhajaGhar"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#4682B4] text-[#F5F6F5] shadow-lg hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-110 transition-all duration-300"
          title="Messenger"
        >
          <FontAwesomeIcon icon={faFacebookMessenger} size="lg" />
        </a>
        <a
          href="https://www.instagram.com/thuldaikhajaghar"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#0A5C36] text-[#F5F6F5] shadow-lg hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-110 transition-all duration-300"
          title="Instagram"
        >
          <FontAwesomeIcon icon={faInstagram} size="lg" />
        </a>
        <a
          href="https://www.tiktok.com/@thuldaikhajaghar"
          target="_blank"
          rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#FF2400] text-[#F5F6F5] shadow-lg hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-110 transition-all duration-300"
          title="TikTok"
        >
          <FontAwesomeIcon icon={faTiktok} size="lg" />
        </a>
      </div>
    </div>
  );
}