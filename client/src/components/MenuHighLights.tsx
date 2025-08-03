import React, { useState, useEffect } from 'react';
import type { MenuItem } from '../firebase/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  collection,
  onSnapshot,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import '../styles/menuHighlights.css'; // Import your custom styles

const MenuHighLights: React.FC = () => {
  const [category, setCategory] = useState<string>('All');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<(MenuItem & { quantity: number })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartUpdated, setIsCartUpdated] = useState<boolean>(false); // New state for animation trigger
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'MenuItem'),
      (snapshot) => {
        const items: MenuItem[] = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) =>
            ({
              id: doc.id,
              name: doc.data().name,
              price: doc.data().price,
              description: doc.data().description,
              category: doc.data().category,
              image: doc.data().image,
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

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setCart(JSON.parse(stored));
  }, []);

  const categories = ['All', ...Array.from(new Set(menuItems.map((i) => i.category)))];

  const filteredMenu = menuItems.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = existingCart.findIndex((c: any) => c.id === item.id);

    if (index >= 0) {
      existingCart[index].quantity = (existingCart[index].quantity || 1) + 1;
    } else {
      existingCart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    setCart(existingCart);
    setIsCartUpdated(true); // Trigger animation
    toast.success(`${item.name} added to cart!`);

    // Reset animation trigger after a short delay
    setTimeout(() => setIsCartUpdated(false), 500);
  };

  const proceedToCheckout = () => navigate('/cart');
  const viewDetails = (id: string) => navigate(`/menu/${id}`);
  const goToMore = () => navigate('/more'); // Placeholder navigation for "More" button

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-teal-700 text-center mb-8">
          Our Menu
        </h1>

        {/* 🔎 Search Bar */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center w-full max-w-md bg-white shadow rounded-md px-3">
            <FontAwesomeIcon icon={faSearch} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search for dishes..."
              className="flex-1 p-2 outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                  active
                    ? 'bg-teal-600 text-white border-teal-600 shadow'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100',
                ].join(' ')}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <p className="text-center text-gray-500">Loading menu...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenu.length > 0 ? (
              filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => viewDetails(item.id)}
                >
                  <div className="overflow-hidden">
                    <img
                      src={item.image || '/assets/carousel/IMG_1632.jpg'}
                      alt={item.name}
                      className="h-48 w-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                      <p className="text-xs uppercase tracking-wide text-teal-700/80">
                        {item.category}
                      </p>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-bold text-green-700">
                        ${item.price.toFixed(2)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                      >
                        🛒 Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No items found.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ✅ Floating Cart Icon and More Button (Right Bottom Corner) */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 right-6 flex space-x-4">
          <button
            onClick={proceedToCheckout}
            className={`bg-teal-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-teal-700 transition-transform z-50 relative ${isCartUpdated ? 'animate-shake' : ''}`}
            aria-label={`View cart with ${totalItems} items`}
            title="View your cart"
          >
            <FontAwesomeIcon icon={faShoppingCart} size="lg" />
            <span
              className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ${isCartUpdated ? 'animate-scale-fade' : ''}`}
            >
              {totalItems}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuHighLights;