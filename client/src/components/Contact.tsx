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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    datetime: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
      setFormData({
        name: "",
        email: "",
        phone: "",
        reason: "",
        datetime: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-teal-700">
            Thul Dai Khaja Ghar
          </h1>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              type="button"
            >
              📞 Order Hotline: 0451 995 722
            </button>

            <button
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              type="button"
              onClick={() =>
                window.open(
                  "https://www.doordash.com/store/thul-dai-khaja-ghar-auburn-28309062/35465555/?event_type=autocomplete&pickup=false",
                  "_blank"
                )
              }
            >
              🛵 Delivery: DoorDash
            </button>

            <button
              className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white hover:opacity-90"
              type="button"
              onClick={() =>
                window.open(
                  "https://www.ubereats.com/au/store/thul-dai-khaja-ghar/ovupCMu8X1OYOI-73G0EfA?diningMode=DELIVERY&mod=storeDeliveryTime&modctx=%257B%2522entryPoint%2522%253A%2522store-auto-surface%2522%252C%2522encodedStoreUuid%2522%253A%2522ovupCMu8X1OYOI-73G0EfA%2522%257D&ps=1&sc=SEARCH_SUGGESTION",
                  "_blank"
                )
              }
            >
              🛵 Delivery: Uber
            </button>
          </div>
        </div>
      </header>

      {/* Info + Map */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Info */}
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
            <div className="space-y-2 text-gray-700">
              <p>📞 0451 995 722</p>
              <p>📧 thuldaikhajaghar@gmail.com</p>
              <p>📍 212-214 Parramatta Road, Auburn 2144, NSW</p>
            </div>

            <h3 className="mt-6 text-lg font-semibold text-gray-800">Opening Hours</h3>
            <p className="text-gray-700">🕐 Mon – Sun: 5:00 PM – 5:00 AM</p>

            <h3 className="mt-6 text-lg font-semibold text-gray-800">Reservations</h3>
            <p className="text-gray-700">
              📅 For group or event bookings, call or use the form below.
            </p>
          </section>

          {/* Map */}
          <section className="rounded-xl overflow-hidden bg-white shadow">
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
        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Reservation / Inquiry Form
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              required
            />

            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              required
            >
              <option value="">Select Reason</option>
              <option value="Table Booking">Table Booking</option>
              <option value="Catering Inquiry">Catering Inquiry</option>
              <option value="Feedback">Feedback</option>
            </select>

            <input
              type="datetime-local"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 md:col-span-1"
            />
            <textarea
              name="message"
              placeholder="Optional Message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 md:col-span-2"
            ></textarea>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-white font-semibold hover:bg-teal-700"
              >
                📩 SUBMIT FORM
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Floating Social Icons */}
      <div className="fixed right-4 bottom-4 flex flex-col gap-3">
        <a
          href="https://wa.me/61451995722"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:brightness-95 transition transform hover:-translate-y-0.5"
          title="Chat on WhatsApp"
        >
          <FontAwesomeIcon icon={faWhatsapp} size="lg" />
        </a>

        <a
          href="https://m.me/ThulDaiKhajaGhar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0084FF] text-white shadow-lg hover:brightness-95 transition transform hover:-translate-y-0.5"
          title="Message on Messenger"
        >
          <FontAwesomeIcon icon={faFacebookMessenger} size="lg" />
        </a>

        <a
          href="https://www.instagram.com/thuldaikhajaghar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 text-white shadow-lg hover:brightness-95 transition transform hover:-translate-y-0.5"
          title="Visit Instagram"
        >
          <FontAwesomeIcon icon={faInstagram} size="lg" />
        </a>

        <a
          href="https://www.tiktok.com/@thuldaikhajaghar"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg hover:brightness-95 transition transform hover:-translate-y-0.5"
          title="Follow on TikTok"
        >
          <FontAwesomeIcon icon={faTiktok} size="lg" />
        </a>
      </div>
    </div>
  );
}
