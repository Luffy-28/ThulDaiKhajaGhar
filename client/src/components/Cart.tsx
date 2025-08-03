import React, { useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../firebase/types';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<(MenuItem & { quantity: number })[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [itemIndexToRemove, setItemIndexToRemove] = useState<number | null>(null);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) setCartItems(JSON.parse(stored));
  }, []);

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setItemIndexToRemove(index);
      setShowAlert(true);
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
    // Check if user is logged in
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, proceed to checkout
        navigate('/checkout', { state: { cartItems, total } });
      } else {
        // User is not logged in, show login alert
        setShowLoginAlert(true);
      }
    });
  };

  const handleLoginRedirect = () => {
    setShowLoginAlert(false);
    navigate('/login');
  };

  const cancelLogin = () => {
    setShowLoginAlert(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-5xl bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-teal-700 mb-6">Your Cart</h1>

        {cartItems.length === 0 ? (
          <p className="text-gray-500">Your cart is empty.</p>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className={`transition-all duration-300 ease-in-out flex flex-col md:flex-row items-start md:items-center gap-4 border rounded-lg p-4 ${
                  removingIndex === index ? 'opacity-0 -translate-x-10 pointer-events-none' : ''
                }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full md:w-28 h-28 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-800">{item.name}</h2>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <p className="mt-1 font-medium text-green-700">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    –
                  </button>
                  <span className="min-w-[2ch] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                  title="Remove"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-lg md:text-xl font-bold text-gray-800">
            Total: <span className="text-teal-700">${total.toFixed(2)}</span>
          </p>
          <div className="w-full md:w-auto">
            <button
              className="w-full md:w-auto px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition duration-200"
              onClick={handleBeginCheckout}
              disabled={cartItems.length === 0}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {showAlert && itemIndexToRemove !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Remove Item</h3>
            <p className="text-gray-600 mb-4">
              Quantity cannot be less than 1. Would you like to remove{' '}
              <span className="font-semibold">{cartItems[itemIndexToRemove].name}</span> from your cart?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelRemove}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => removeItem(itemIndexToRemove)}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-4">
              You must be logged in to proceed to checkout. Would you like to log in now?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLogin}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleLoginRedirect}
                className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700"
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