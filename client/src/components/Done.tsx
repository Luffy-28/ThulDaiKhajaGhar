import React, { useState, useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { auth } from '../firebase/config'; // Adjust path if needed
import '../index.css';

const Done: React.FC = () => {
  const { state } = useLocation();
  const [status, setStatus] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (state?.paymentStatus) {
      setStatus(state.paymentStatus);
    } else {
      setStatus('unknown');
    }
  }, [state]);

  useEffect(() => {
    if (status === 'succeeded' && user) {
      localStorage.removeItem('pendingOrder');

      // Stop confetti after 3 seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);

      // ✅ Save card details to backend
      const saveCardDetails = async () => {
        try {
          const paymentIntentId = state?.paymentIntentId;
          if (!paymentIntentId) {
            console.error("❌ No paymentIntentId received from checkout");
            setSaveMessage("Unable to save card details (missing payment ID).");
            return;
          }

          const response = await fetch('http://localhost:5001/save-card-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId, userId: user.uid }),
          });

          const data = await response.json();
          console.log("🔄 Save card response:", data);

          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to save card details');
          }

          setSaveMessage("✅ Your card details were saved successfully.");
        } catch (error: any) {
          console.error('❌ Error saving card details:', error.message);
          setSaveMessage("⚠️ Failed to save your card details. Please try again later.");
        }
      };

      saveCardDetails();

      return () => clearTimeout(timer);
    }
  }, [status, user, state]);

  if (!status) return <div className="spinner flex items-center justify-center h-screen">Loading...</div>;
  if (status !== 'succeeded') return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 relative">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      <div className="container mx-auto max-w-5xl bg-white shadow-lg rounded-xl p-6 text-center z-10">
        <DotLottieReact
          src="https://lottie.host/f70430c7-a98c-40a9-a082-3216d03a8442/wLdaRh5eir.lottie"
          loop
          autoplay
          className="mx-auto mb-4 w-32 h-32"
        />
        <p className="message text-2xl font-bold text-green-600 mb-4 fade-in">
          🎉 Your purchase was successful!
        </p>

        {saveMessage && (
          <p className="text-md mt-2 font-medium text-gray-700">{saveMessage}</p>
        )}

        <Link
          to="/menu"
          className="button inline-block px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition duration-200 hover:scale-105 mt-4"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
};

export default Done;
