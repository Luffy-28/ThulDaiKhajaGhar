import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { MenuItem } from "../firebase/types";
import image1 from "../assets/carousel/IMG_1632.jpg";
import image2 from "../assets/carousel/IMG_1631.jpg";
import image3 from "../assets/carousel/imageWall.jpeg";

const carouselImages = [image1, image2, image3];

const menuItems: MenuItem[] = [
  { id: "1", name: "Margherita Pizza", price: 12.99, description: "Classic pizza with tomato and mozzarella", category: "pizza" },
  { id: "2", name: "Caesar Salad", price: 8.99, description: "Fresh romaine with Caesar dressing", category: "salad" },
  { id: "3", name: "Pasta Alfredo", price: 14.99, description: "Creamy Alfredo sauce with fettuccine", category: "pasta" },
];

const HomePage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cart, setCart] = useState<MenuItem[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isHovered && carouselImages.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, carouselImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide((index + carouselImages.length) % carouselImages.length);
  };

  const addToCart = (item: MenuItem) => {
    setCart((c) => [...c, item]);
    toast.success(`${item.name} added to cart!`);
  };

  const proceedToCheckout = () => {
    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/checkout"); // change to '/order' if that's your flow
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 pt-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold text-teal-700">
          Thul Dai Khaja Ghar
        </h1>
        <p className="mt-4 text-gray-700 max-w-3xl mx-auto">
          Experience the finest Indian and Nepali cuisine with bold flavors, rich heritage, and heartfelt service.
        </p>
      </header>

      {/* Carousel */}
      <section
        className="relative mx-auto mt-8 max-w-6xl px-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-64 sm:h-80 md:h-[28rem] overflow-hidden rounded-2xl shadow-lg">
          {/* Slides stacked; we fade/scale the active one */}
          {carouselImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                currentSlide === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={img}
                alt={`Slide ${index + 1}`}
                className={`h-full w-full object-cover transition-transform duration-700 ${
                  currentSlide === index ? "scale-100" : "scale-105"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {carouselImages.map((_, i) => {
            const active = currentSlide === i;
            return (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  active ? "bg-teal-600 w-6" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            );
          })}
        </div>

        {/* Arrows */}
        <button
          className="absolute left-6 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
          onClick={() => goToSlide(currentSlide - 1)}
          aria-label="Previous slide"
        >
          ‹
        </button>
        <button
          className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
          onClick={() => goToSlide(currentSlide + 1)}
          aria-label="Next slide"
        >
          ›
        </button>
      </section>

      {/* Popular Items */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
         Popular Items
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
            >
              <img
                src={carouselImages[0]} // replace with actual item images if available
                alt={item.name}
                className="h-44 w-full object-cover"
              />
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-bold text-green-700">${item.price.toFixed(2)}</p>
                  <button
                    onClick={() => addToCart(item)}
                    className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Preview */}
        {cart.length > 0 && (
          <div className="mt-8 max-w-2xl rounded-xl bg-white p-5 shadow mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Cart</h3>
            <div className="divide-y">
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-800">{item.name}</span>
                  <span className="text-gray-700">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="text-teal-700">
                ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
              </span>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={proceedToCheckout}
                className="rounded-md bg-teal-600 px-4 py-2 text-white font-semibold hover:bg-teal-700"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Owner Section */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold text-red-500">About the Owner</h2>
          <p className="mt-3 text-gray-700 leading-relaxed">
            <strong>Lok Raj Kandel</strong> is a seasoned businessman from Nepal with a deep passion for food and hospitality.
            He brings authentic Nepali and Indian flavors to Australia with warmth and pride.
            <br /><br />
            Thul Dai Khaja Ghar was born from his dream of offering a welcoming, flavorful escape rooted in culture, tradition,
            and community.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-gray-700">
          🍽️ Dine with us or order online to enjoy Thul Dai Khaja Ghar's delights from the comfort of your home.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
