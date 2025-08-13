import React, { useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../firebase/types';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import icon from '../assets/logo.svg'

const MenuImage: React.FC<{
  src?: string | null;
  alt: string;
  className: string;
}> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const FALLBACK_IMAGE =
    icon ||
    'https://via.placeholder.com/300x200?text=No+Image';

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = FALLBACK_IMAGE;
    setIsLoaded(true);
  };

  const handleImgLoad = () => {
    setIsLoaded(true);
  };

  const safeSrc = (imgSrc?: string | null) =>
    imgSrc && imgSrc.trim() !== '' ? imgSrc : FALLBACK_IMAGE;

  return (
    <div>
      <img
        src={safeSrc(src)}
        alt={`${alt} dish`} // Improved alt text for accessibility
        loading="lazy"
        decoding="async"
        onError={handleImgError}
        onLoad={handleImgLoad}
        className={`w-full h-full object-cover transition-transform duration-300 ${className}`}
      />
    </div>
  );
};

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<(MenuItem & { quantity: number })[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [itemIndexToRemove, setItemIndexToRemove] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  const navigate = useNavigate();
  // Load from storage and clamp any quantities > 5 (safety)
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const parsed: (MenuItem & { quantity: number })[] = JSON.parse(stored);
      let changed = false;
      const clamped = parsed.map((it) => {
        if (it.quantity > 5) {
          changed = true;
          return { ...it, quantity: 5 };
        }
        if (it.quantity < 1) {
          changed = true;
          return { ...it, quantity: 1 };
        }
        return it;
      });
      setCartItems(clamped);
      if (changed) {
        localStorage.setItem('cart', JSON.stringify(clamped));
      }
    }
  }, []);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setItemIndexToRemove(index);
      setShowAlert(true);
      return;
    }

    if (newQuantity > 5) {
      toast.warning(`You can only order a maximum of 5 units of ${cartItems[index].name}`);
      return;
    }

    const updated = [...cartItems];
    updated[index].quantity = newQuantity;
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (index: number) => {
    setRemovingIndex(index);
    setTimeout(() => {
      const updated = [...cartItems];
      updated.splice(index, 1);
      setCartItems(updated);
      localStorage.setItem('cart', JSON.stringify(updated));
      setRemovingIndex(null);
      setShowAlert(false);
      setItemIndexToRemove(null);
    }, 300);
  };

  const cancelRemove = () => {
    setShowAlert(false);
    setItemIndexToRemove(null);
  };

  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleBeginCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('🛒 Your cart is empty. Please add items from the menu.');
      return;
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/checkout', { state: { cartItems, total } });
      } else {
        setShowLoginAlert(true);
      }
    });
  };

  const handleLoginRedirect = () => {
    setShowLoginAlert(false);
    navigate('/login', { state: { redirectTo: '/checkout', cartItems, total } });
  };

  const cancelLogin = () => {
    setShowLoginAlert(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-8 px-4">
      <div className="mx-auto max-w-5xl bg-[#F5F6F5] shadow-xl rounded-xl p-6 border border-[#4682B4]/20">
        <h1 className="text-3xl font-extrabold text-[#FF2400] mb-6">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-[#4682B4]">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, index) => {
              const atLimit = item.quantity >= 5;
              return (
                <div
                  key={index}
                  onClick={() => navigate(`/menu/${item.id}`)}
                  className={`transition-all duration-300 ease-in-out flex flex-col md:flex-row items-start md:items-center gap-4 border rounded-lg p-4 shadow-sm hover:shadow-xl hover:scale-[1.02] border-[#4682B4]/20 hover:border-[#FF2400] cursor-pointer ${
                    removingIndex === index ? 'opacity-0 -translate-x-10 pointer-events-none' : ''
                  }`}
                >
                  <MenuImage
                    src={item.image}
                    alt={item.name}
                    className="w-full md:w-28 h-28 object-cover rounded-md border border-[#4682B4]/40 group-hover:scale-105 transition-all duration-300"
                  />
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#0A5C36]">{item.name}</h2>
                    <p className="text-sm text-[#0A5C36]">{item.description}</p>
                    <p className="mt-1 font-medium text-[#0A5C36]">${item.price.toFixed(2)}</p>
                  </div>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#4682B4] bg-[#F5F6F5] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
                      title="Decrease quantity"
                      aria-label="Decrease quantity"
                    >
                      –
                    </button>
                    <span className="min-w-[2ch] text-center text-[#0A5C36]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      disabled={atLimit}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#4682B4] bg-[#F5F6F5] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300 ${
                        atLimit ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title={atLimit ? 'Maximum 5 per item' : 'Increase quantity'}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemIndexToRemove(index);
                      setShowAlert(true);
                    }}
                    className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[#FF2400] hover:bg-[#FF2400] hover:text-[#F5F6F5] hover:shadow-md transition-all duration-300"
                    title="Remove"
                    aria-label="Remove item"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xl font-bold text-[#0A5C36]">
            Total: <span className="text-[#FF2400]">${total.toFixed(2)}</span>
          </p>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/menu')}
              className="w-full md:w-auto px-6 py-2 rounded-full bg-[#4682B4] text-white font-semibold shadow hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-lg transition-all duration-300"
            >
              Add Items
            </button>
            <button
              className="w-full md:w-auto px-6 py-2 rounded-full bg-[#FF2400] text-[#F5F6F5] font-semibold shadow hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-lg transition-all duration-300"
              onClick={handleBeginCheckout}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Item Remove Alert */}
      {showAlert && itemIndexToRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#F5F6F5] p-6 shadow-2xl border border-[#4682B4]/40">
            <h3 className="text-lg font-bold text-[#FF2400] mb-2">Remove Item</h3>
            <p className="text-[#0A5C36] mb-4">
              Quantity cannot be less than 1. Would you like to remove{' '}
              <span className="font-semibold">{cartItems[itemIndexToRemove].name}</span> from your cart?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRemove}
                className="px-4 py-2 rounded-md border border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => removeItem(itemIndexToRemove)}
                className="px-4 py-2 rounded-md bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Alert */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-[#F5F6F5] p-6 shadow-2xl border border-[#4682B4]/40">
            <h3 className="text-lg font-bold text-[#FF2400] mb-2">Login Required</h3>
            <p className="text-[#0A5C36] mb-4">
              You must be logged in to proceed to checkout. Would you like to log in now?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLogin}
                className="px-4 py-2 rounded-md border border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLoginRedirect}
                className="px-4 py-2 rounded-md bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;