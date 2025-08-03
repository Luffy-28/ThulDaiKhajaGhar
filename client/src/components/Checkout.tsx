import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { MenuItem } from '../firebase/types';
import CheckoutForm from './ui/CheckoutForm';
import { db, auth } from '../firebase/config'; // Adjust path to your Firebase config
import { doc, getDoc } from 'firebase/firestore';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const Checkout: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState<string | null>(null);
  const [total, setTotal] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]); // Store saved card details
  const user = auth.currentUser;

  // Extract cartItems from location state
  const cartItems = (state?.cartItems || []) as (MenuItem & { quantity: number })[];

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart'); // Redirect to cart if no items
      return;
    }

    // Fetch client secret and amounts from backend
    const fetchClientSecret = async () => {
      try {
        console.log('Sending cart items:', cartItems); // Debug cart items
        const res = await fetch('http://localhost:5001/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: cartItems }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Create PI failed:', res.status, errorData);
          setError(`Could not start payment: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`);
          return;
        }

        const data = await res.json();
        setClientSecret(data.clientSecret);
        setSubtotal(data.subtotal);
        setTotal(data.total);
      } catch (e) {
        console.error('Fetch error:', e);
        setError(`Network error starting payment: ${e}`);
      }
    };

    // Fetch saved cards
    const fetchSavedCards = async () => {
      if (user) {
        const cardDetailsRef = doc(db, 'users', user.uid, 'cardDetails', 'default');
        const docSnap = await getDoc(cardDetailsRef);
        if (docSnap.exists()) {
          setSavedCards([docSnap.data()]);
        }
      }
    };

    fetchClientSecret();
    fetchSavedCards();
  }, [cartItems, navigate, user]);

  const handlePaid = (paymentData: any) => {
    localStorage.removeItem('cart');
    navigate('/done', {
      state: {
        paymentStatus: 'succeeded',
        paymentIntentId: paymentData.paymentIntentId,
      },
    });
  };

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? ({
            clientSecret,
            appearance: { theme: 'stripe' },
            loader: 'auto',
          } as const)
        : undefined,
    [clientSecret]
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-5xl bg-white shadow rounded-xl p-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-teal-700 mb-6">Checkout</h1>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : !clientSecret ? (
          <p className="text-gray-600">Loading payment details...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 border rounded-lg p-4 bg-gray-50"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-medium text-green-700">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 mt-2">
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
              {savedCards.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-700 mb-2">Saved Cards</h3>
                  {savedCards.map((card, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md mb-2">
                      <span>Card ending in {card.paymentMethodId.slice(-4)}</span>
                      <button
                        className="px-2 py-1 bg-teal-600 text-white rounded-md text-sm hover:bg-teal-700"
                        onClick={() => console.log('Use card:', card.paymentMethodId)}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Elements stripe={stripePromise} options={elementsOptions}>
                <CheckoutForm onPaid={handlePaid} cartItems={cartItems} />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;