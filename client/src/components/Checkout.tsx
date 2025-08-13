import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import type { MenuItem } from '../firebase/types';
import CheckoutForm from './ui/CheckoutForm';
import { db, auth } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const Checkout: React.FC = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState<string | null>(null);
  const [total, setTotal] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const user = auth.currentUser;
  const cartItems = (state?.cartItems || []) as (MenuItem & { quantity: number })[];

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    const fetchClientSecret = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: cartItems }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to create payment intent');
          return;
        }

        setClientSecret(data.clientSecret);
        setSubtotal(data.subtotal);
        setTotal(data.total);
      } catch (e) {
        setError('Network error starting payment');
      }
    };

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
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#FF2400', // Saffron Red
                colorBackground: '#F5F6F5', // Himalayan White
                colorText: '#0A5C36', // Evergreen
                colorDanger: '#FF2400', // Saffron Red
                borderRadius: '0.5rem',
              },
              rules: {
                '.Input': {
                  borderColor: '#4682B4', // Slate Blue
                  boxShadow: 'none',
                },
                '.Input:hover': {
                  borderColor: '#FFC107', // Marigold Yellow
                  boxShadow: '0 0 0 2px rgba(255, 193, 7, 0.2)',
                },
                '.Button': {
                  backgroundColor: '#FF2400', // Saffron Red
                  color: '#F5F6F5', // Himalayan White
                  border: 'none',
                },
                '.Button:hover': {
                  backgroundColor: '#FFC107', // Marigold Yellow
                  color: '#0A5C36', // Evergreen
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
              },
            },
            loader: 'auto',
          } as const)
        : undefined,
    [clientSecret]
  );

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-10 px-6">
      <div className="mx-auto max-w-5xl bg-[#F5F6F5] shadow-lg rounded-2xl p-6 border border-[#4682B4]/20">
        <h1 className="text-3xl font-extrabold text-[#FF2400] mb-8">Checkout</h1>

        {error ? (
          <p className="text-[#FF2400]">{error}</p>
        ) : !clientSecret ? (
          <p className="text-[#4682B4]">Loading payment details...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 🧾 Order Summary */}
            <div>
              <h2 className="text-lg font-semibold text-[#0A5C36] mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-4 border rounded-lg p-4 bg-[#F5F6F5] hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-[#4682B4]/20 hover:border-[#FF2400]"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md border border-[#4682B4]/40 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-[#0A5C36]">{item.name}</p>
                      <p className="text-sm text-[#0A5C36]">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-[#0A5C36]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-6 border-t border-[#4682B4]/20 pt-4">
                  <div className="flex justify-between text-[#0A5C36]">
                    <span>Subtotal</span>
                    <span>${subtotal}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#0A5C36] mt-2">
                    <span>Total</span>
                    <span className="text-[#FF2400]">${total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 💳 Payment Section */}
            <div>
              <h2 className="text-lg font-semibold text-[#0A5C36] mb-4">Payment Details</h2>

              {savedCards.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-medium text-[#0A5C36] mb-2">Saved Cards</h3>
                  {savedCards.map((card, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border rounded-md p-3 bg-[#F5F6F5] border-[#4682B4]/20"
                    >
                      <span className="text-[#0A5C36] text-sm">
                        💳 Card ending in {card.paymentMethodId.slice(-4)}
                      </span>
                      <button
                        className="px-3 py-1 rounded-full bg-[#FF2400] text-[#F5F6F5] text-sm hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
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