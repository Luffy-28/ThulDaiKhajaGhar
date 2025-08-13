import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { toast } from "react-toastify";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp, faFacebookMessenger, faInstagram, faTiktok, faFacebook } from "@fortawesome/free-brands-svg-icons";

import image1 from '../assets/carousel/IMG_1632.jpg';
import image2 from '../assets/carousel/IMG_1631.jpg';
import image3 from '../assets/carousel/imageWall.jpeg';

const carouselItems = [
  { image: image1, title: 'Welcome to Thul Dai Khaja Ghar', description: 'A traditional Nepali dining experience in every bite.' },
  { image: image2, title: 'Authentic Nepali Flavors', description: 'Savor momos, thalis, and heritage dishes crafted with love.' },
  { image: image3, title: 'Feel at Home', description: 'Hospitality and warmth inspired by Nepali tradition.' },
];

const scrollToNext = () => {
  const nextSection = document.querySelector('.our-story');
  nextSection?.scrollIntoView({ behavior: 'smooth' });
};

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", reason: "", datetime: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1 },
    dragSpeed: 1.5,
    rubberband: false,
    renderMode: 'performance',
    mode: 'snap',
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
      setIsManual(false);
    },
    created() {
      setCurrentSlide(0);
    },
    dragStarted() {
      setIsManual(true);
    },
    breakpoints: {
      '(max-width: 640px)': {
        dragSpeed: 2,
      },
    },
  });

  useEffect(() => {
    if (!isHovered && !isManual && instanceRef.current) {
      timerRef.current = setInterval(() => {
        instanceRef.current?.next();
      }, 3000);
    }
    return () => clearInterval(timerRef.current!);
  }, [isHovered, isManual, instanceRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      await addDoc(collection(db, "inquiries"), {
        ...formData,
        createdAt: new Date(),
        status: "pending",
      });
      setFormData({ name: "", email: "", phone: "", reason: "", datetime: "", message: "" });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll scroll-smooth">
      {/* Carousel */}
      <section
        className="snap-start h-screen relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div ref={sliderRef} className="keen-slider h-full">
          {carouselItems.map((item, index) => (
            <div key={index} className="keen-slider__slide relative h-screen w-full">
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${item.image})` }}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="bg-black/50 w-full h-full flex flex-col justify-center items-center text-[#F5F6F5] px-6 text-center">
                  <motion.h1
                    className="text-3xl sm:text-4xl md:text-6xl font-bold text-[#FF2400]"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    {item.title}
                  </motion.h1>
                  <motion.p
                    className="mt-4 text-lg sm:text-xl md:text-2xl font-light text-[#F5F6F5] max-w-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    {item.description}
                  </motion.p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {carouselItems.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                instanceRef.current?.moveToIdx(i);
                setIsManual(true);
              }}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                currentSlide === i ? 'bg-[#F5F6F5] w-5' : 'bg-[#F5F6F5]/50 hover:bg-[#F5F6F5]/80'
              }`}
            />
          ))}
        </div>

        {/* Arrow Buttons */}
        <button
          className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[#F5F6F5]/70 text-[#0A5C36] text-2xl font-bold shadow hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300"
          onClick={() => {
            instanceRef.current?.prev();
            setIsManual(true);
          }}
        >
          ‹
        </button>
        <button
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 items-center justify-center rounded-full bg-[#F5F6F5]/70 text-[#0A5C36] text-2xl font-bold shadow hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300"
          onClick={() => {
            instanceRef.current?.next();
            setIsManual(true);
          }}
        >
          ›
        </button>

        {/* Scroll Down Arrow */}
        <div
          onClick={scrollToNext}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 cursor-pointer hover:scale-125 hover:text-[#FFC107] transition-all duration-300"
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <svg
              className="w-6 h-6 text-[#F5F6F5]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <motion.section
        className="snap-start h-screen flex items-center justify-center bg-[#F5F6F5] px-6 our-story"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#FF2400] mb-6">Our Story</h2>
          <p className="text-base sm:text-lg text-[#0A5C36] leading-relaxed">
            Welcome to <strong>Thul Dai Khaja Ghar</strong>, a celebration of Nepali heritage, flavors, and heartfelt hospitality.
            Rooted in the bustling culture of Kathmandu, our recipes have been passed down through generations, preserving the authentic taste of our homeland.
            Every momo, thali, and sip of chiya tells a story — a story of mountain villages, vibrant markets, and families gathered around the table.
            Our mission is to bring that same warmth and authenticity to the heart of Sydney, offering a place where friends and families can come together,
            share a meal, and create memories that last.
          </p>
        </div>
      </motion.section>

      {/* About Owner */}
      <motion.section
        className="snap-start h-screen flex items-center justify-center bg-[#F5F6F5] px-6"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#FF2400] mb-6">About the Owner</h2>
          <p className="text-base sm:text-lg text-[#0A5C36] leading-relaxed">
            The mind behind <strong>Thul Dai Khaja Ghar</strong> is a seasoned entrepreneur from Nepal with decades of
            experience in transport, logistics, and hospitality. Known for his dedication, vision, and people-first approach,
            he’s now channeling his lifelong passion for food and community into this venture — creating a space that feels like home,
            serving food that feeds both heart and soul.
          </p>
        </div>
      </motion.section>

      {/* Footer */}
       <motion.footer
          className="snap-start bg-[#F5F6F5] text-[#0A5C36] px-4 sm:px-6 py-6 flex flex-col gap-6"
         >
            {/* Contact Info & Map */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Info */}
        <section className="rounded-xl bg-[#F5F6F5] p-4 shadow border border-[#4682B4]/20">
          <h2 className="text-xl font-bold text-[#FF2400] mb-4">Contact Information</h2>
          <p>📞 0451 995 722</p>
          <p>📧 thuldaikhajaghar@gmail.com</p>
          <p>📍 212-214 Parramatta Road, Auburn 2144, NSW</p>
          <h3 className="mt-4 text-lg font-semibold text-[#FF2400]">Opening Hours</h3>
          <p>🕐 Mon – Sun: 5:00 PM – 5:00 AM</p>
        </section>

        {/* Map */}
        <section className="rounded-xl overflow-hidden shadow border border-[#4682B4]/20">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps?q=212-214+Parramatta+Road,+Auburn+2144,+NSW&output=embed"
            className="w-full h-64 md:h-full"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </section>
      </div>

      {/* Form */}
      <section className="bg-[#F5F6F5] p-4 rounded-xl shadow border border-[#4682B4]/20">
        <h2 className="text-xl font-bold text-[#FF2400] mb-4">Reservation / Inquiry Form</h2>

        {success ? (
          // ✅ Success Animation
          <motion.div
            className="flex flex-col items-center justify-center py-4 relative"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-white"
                initial={{ x: 0, y: 0, opacity: 0.6, scale: 1 }}
                animate={{
                  x: 200 - i * 25,
                  y: -200 + i * 20,
                  opacity: 0,
                  scale: 0.2,
                }}
                transition={{ duration: 1.2, delay: i * 0.05, ease: "easeOut" }}
              />
            ))}
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-12 h-12 text-blue-500 relative z-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: 200, y: -200, opacity: 0, rotate: 20 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l18-7-7 18-2-6-6-2z" />
            </motion.svg>
            <p className="mt-2 text-green-600 font-semibold">Your inquiry has been sent!</p>
          </motion.div>
        ) : (
          // ✅ Form
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} required
              className="w-full rounded-md border border-[#4682B4] px-3 py-2" />
            <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required
              className="w-full rounded-md border border-[#4682B4] px-3 py-2" />
            <input name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required
              className="w-full rounded-md border border-[#4682B4] px-3 py-2" />
            <select name="reason" value={formData.reason} onChange={handleChange} required
              className="w-full rounded-md border border-[#4682B4] px-3 py-2 bg-[#F5F6F5]">
              <option value="">Select Reason</option>
              <option value="Table Booking">Table Booking</option>
              <option value="Catering Inquiry">Catering Inquiry</option>
              <option value="Feedback">Feedback</option>
            </select>
            <input name="datetime" type="datetime-local" value={formData.datetime} onChange={handleChange}
              className="w-full rounded-md border border-[#4682B4] px-3 py-2" />
            <textarea name="message" placeholder="Optional Message" value={formData.message} onChange={handleChange} rows={2}
              className="w-full sm:col-span-2 rounded-md border border-[#4682B4] px-3 py-2"></textarea>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center justify-center rounded-md px-5 py-2 font-bold transition-all duration-300 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF2400] hover:bg-[#FFC107] hover:text-[#0A5C36]'
                } text-[#F5F6F5]`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                ) : '📩 SUBMIT FORM'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Social Icons */}
      <div className="flex justify-center flex-wrap gap-4">
        <a href="https://www.facebook.com/profile.php?id=61568657361565" target="_blank" rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#FF2400] text-[#F5F6F5]">
          <FontAwesomeIcon icon={faFacebook} size="lg" />
        </a>
        <a href="https://www.tiktok.com/@thul_dai_khaja_ghar?is_from_webapp=1&sender_device=pc" target="_blank" rel="noopener noreferrer"
          className="h-12 w-12 flex items-center justify-center rounded-full bg-[#FF2400] text-[#F5F6F5]">
          <FontAwesomeIcon icon={faTiktok} size="lg" />
        </a>
      </div>
    </motion.footer>

    </div>
  );
};

export default HomePage;
