import React, { useState, useEffect, useRef } from 'react';
import type { MenuItem } from '../firebase/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  collection,
  onSnapshot,
  getDoc,
  doc,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faTimes,
  faShoppingCart,
} from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import icon from '../assets/logo.svg';

// Reusable MenuImage component
const MenuImage: React.FC<{
  src?: string | null;
  alt: string;
  className: string;
}> = ({ src, alt, className }) => {
  const FALLBACK_IMAGE =
    icon ||
    'https://via.placeholder.com/300x200?text=No+Image';

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  const safeSrc = (imgSrc?: string | null) =>
    imgSrc && imgSrc.trim() !== '' ? imgSrc : FALLBACK_IMAGE;

  return (
    <div className="relative w-full h-full bg-gray-200 ">
      <img
        src={safeSrc(src)}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={handleImgError}
        className={`w-full h-full object-cover ${className}`}
      />
    </div>
  );
};

const MenuHighLights: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cart, setCart] = useState<(MenuItem & { quantity: number })[]>([]);
  const [isCartUpdated, setIsCartUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();

  // Keen slider (swipe only, smooth)
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: false,
    drag: true,
    mode: 'free-snap',
    rubberband: true,
    slides: { perView: 1.2, spacing: 15 },
    breakpoints: {
      '(min-width: 640px)': { slides: { perView: 2.2, spacing: 15 } },
      '(min-width: 1024px)': { slides: { perView: 3.2, spacing: 15 } },
    },
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all menu items (real-time)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'MenuItem'),
      (snapshot) => {
        const items: MenuItem[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as MenuItem)
        );
        setMenuItems(items);
        setLoading(false);
      },
      (error) => {
        toast.error('Error fetching menu: ' + error.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch top 5 popular items in REAL-TIME (supports id OR name)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), async (ordersSnap) => {
      const countById: Record<string, number> = {};
      const countByName: Record<string, number> = {};

      ordersSnap.forEach((orderDoc) => {
        const data = orderDoc.data() as any;
        const orderItems: any[] = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.cart)
          ? data.cart
          : Array.isArray(data.orderItems)
          ? data.orderItems
          : [];

        orderItems.forEach((item: any) => {
          const itemId =
            item?.id ??
            item?.itemId ??
            item?.menuItemId ??
            item?.menu_id ??
            null;

          const qty = Number(item?.quantity ?? 1);

          if (itemId) {
            countById[itemId] = (countById[itemId] || 0) + qty;
          } else if (item?.name) {
            const nameKey = String(item.name).trim().toLowerCase();
            countByName[nameKey] = (countByName[nameKey] || 0) + qty;
          }
        });
      });

      // Resolve name -> id using loaded menuItems
      if (Object.keys(countByName).length > 0 && menuItems.length > 0) {
        for (const mi of menuItems) {
          const key = (mi?.name || '').trim().toLowerCase();
          if (key && countByName[key]) {
            countById[mi.id] = (countById[mi.id] || 0) + countByName[key];
          }
        }
      }

      const sortedIds = Object.keys(countById)
        .sort((a, b) => countById[b] - countById[a])
        .slice(0, 5);

      // Prefer in-memory items first
      const fromState = sortedIds
        .map((id) => menuItems.find((m) => m.id === id) || null)
        .filter((x): x is MenuItem => x !== null);

      // Fetch any missing ones
      const missingIds = sortedIds.filter((id) => !fromState.some((m) => m.id === id));
      let fetched: MenuItem[] = [];
      if (missingIds.length) {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const snap = await getDoc(doc(db, 'MenuItem', id));
              return snap.exists()
                ? ({ id: snap.id, ...snap.data() } as MenuItem)
                : null;
            } catch {
              return null;
            }
          })
        );
        fetched = results.filter((x): x is MenuItem => x !== null);
      }

      setPopularItems([...fromState, ...fetched]);
    });

    return () => unsubscribe();
  }, [menuItems]);

  // Load cart from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // Grouping + search filter
  const groupedItems = menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const cat = item.category || 'Others';
    if (item.name.toLowerCase().includes(debouncedQuery.toLowerCase())) {
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
    }
    return acc;
  }, {});

  const categories = Object.keys(groupedItems);

  // Observe sections for sticky category highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          const cat = visible.target.getAttribute('data-category');
          if (cat) setActiveCategory(cat);
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0.1 }
    );

    categories.forEach((cat) => {
      const ref = sectionRefs.current[cat];
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [categories]);

  const scrollToCategory = (cat: string) => {
    sectionRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Limit to 5 items per product
  const addToCart = (item: MenuItem) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = existingCart.findIndex((c: any) => c.id === item.id);

    if (index >= 0) {
      if ((existingCart[index].quantity || 1) >= 5) {
        toast.warning(`You can only order a maximum of 5 units of ${item.name}`);
        return;
      }
      existingCart[index].quantity = (existingCart[index].quantity || 1) + 1;
    } else {
      existingCart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    setCart(existingCart);
    setIsCartUpdated(true);
    toast.success(`${item.name} added to cart!`);
    setTimeout(() => setIsCartUpdated(false), 500);
  };

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const viewDetails = (id: string) => navigate(`/menu/${id}`);
  const proceedToCheckout = () => navigate('/cart');

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-8 px-4 sm:px-6 lg:px-8">
      {/* Search, Title, Category Bar */}
      <div className="mt-[20px] sticky top-[88.5px] z-40 bg-[#F5F6F5] shadow-md">
        {/* Search */}
        <div className="flex items-center gap-2 max-w-4xl mx-auto px-4 py-2">
          <FontAwesomeIcon icon={faSearch} className="text-[#FF2400]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes..."
            className="w-full bg-transparent border-b border-[#4682B4] focus:outline-none text-[#0A5C36] text-sm py-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#FF2400]">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {/* Menu Title */}
        <div className="pt-0 pb-1 text-center">
          <h1 className="text-3xl font-extrabold text-[#0A5C36] tracking-wide">
            <span className="text-[#FF2400] hover:text-[#0A5C36]">Our Menu</span>
          </h1>
        </div>

        {/* Category Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 overflow-x-auto px-4 py-2 no-scrollbar">
          {categories.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => scrollToCategory(cat)}
              className={`relative px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-all duration-300 ${
                activeCategory === cat
                  ? 'text-[#FF2400] z-10'
                  : 'text-[#0A5C36] hover:text-[#FFC107]'
              }`}
              animate={activeCategory === cat ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div
                  layoutId="active-category-border"
                  className="absolute inset-0 border-2 border-[#FFC107] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Popular Items Section */}
      {popularItems.length > 0 && (
        <div className="mb-8 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-[#FF2400] mb-4">Popular Items</h2>
          <div ref={sliderRef} className="px-4 py-3 keen-slider">
            {popularItems.map((item) => {
              const cartQty = cart.find((c) => c.id === item.id)?.quantity || 0;
              const atLimit = cartQty >= 5;
              return (
                <div
                  key={item.id}
                  className="keen-slider__slide group bg-[#F5F6F5] rounded-xl shadow hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden flex flex-col cursor-pointer border border-[#4682B4]/20 hover:border-[#FF2400]"
                  onClick={() => viewDetails(item.id)}
                >
                  <MenuImage
                    src={item.image}
                    alt={item.name}
                    className="h-40 w-full object-cover rounded-t-xl"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-[#0A5C36]">{item.name}</h3>
                    <p className="text-sm text-[#4682B4]">{item.category}</p>
                    <p className="text-sm text-[#0A5C36] line-clamp-3">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-bold text-[#0A5C36]">${item.price.toFixed(2)}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!atLimit) addToCart(item);
                        }}
                        disabled={atLimit}
                        title={atLimit ? 'You have reached the max quantity for this item' : ''}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300
                          ${
                            atLimit
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-[#FF2400] text-white hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95'
                          }`}
                      >
                        <FontAwesomeIcon icon={faShoppingCart} />
                        {atLimit ? 'Max Reached' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-[#4682B4]">Loading menu...</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat}
              ref={(el) => {
                sectionRefs.current[cat] = el;
              }}
              data-category={cat}
              className="mb-12 scroll-mt-[160px]"
            >
              <h2 className="text-2xl font-bold text-[#FF2400] mb-4">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedItems[cat].map((item, index) => {
                  const cartQty = cart.find((c) => c.id === item.id)?.quantity || 0;
                  const atLimit = cartQty >= 5;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="group bg-[#F5F6F5] rounded-xl shadow hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] overflow-hidden flex flex-col cursor-pointer border border-[#4682B4]/20 hover:border-[#FF2400]"
                      onClick={() => viewDetails(item.id)}
                    >
                      <MenuImage
                        src={item.image}
                        alt={item.name}
                        className="h-48 w-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="mb-2">
                          <h2 className="text-lg font-bold text-[#0A5C36]">{item.name}</h2>
                          <p className="text-xs uppercase tracking-wide text-[#4682B4]">{item.category}</p>
                        </div>
                        <p className="text-sm text-[#0A5C36] line-clamp-3">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-lg font-bold text-[#0A5C36]">${item.price.toFixed(2)}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!atLimit) addToCart(item);
                            }}
                            disabled={atLimit}
                            title={atLimit ? 'You have reached the max quantity for this item' : ''}
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300
                              ${
                                atLimit
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-[#FF2400] text-white hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95'
                              }`}
                          >
                            <FontAwesomeIcon icon={faShoppingCart} />
                            {atLimit ? 'Max Reached' : 'Add to Cart'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Cart */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 flex space-x-4 z-50">
          <button
            onClick={proceedToCheckout}
            className={`bg-[#FF2400] text-[#F5F6F5] rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-110 transition-all duration-300 relative ${
              isCartUpdated ? 'animate-bounce' : ''
            }`}
            aria-label="View cart"
            title="View your cart"
          >
            <FontAwesomeIcon icon={faShoppingCart} size="lg" />
            <span className="absolute -top-1 -right-1 bg-[#e50505] text-[#F5F6F5] text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuHighLights;