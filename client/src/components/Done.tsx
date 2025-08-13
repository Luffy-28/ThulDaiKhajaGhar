import React, { useState, useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { auth } from '../firebase/config';
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
      const timer = setTimeout(() => setShowConfetti(false), 3000);

      const saveCardDetails = async () => {
        try {
          const paymentIntentId = state?.paymentIntentId;
          if (!paymentIntentId) {
            setSaveMessage("Unable to save card details (missing payment ID).");
            return;
          }

          const response = await fetch('http://localhost:5001/save-card-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId, userId: user.uid }),
          });

          const data = await response.json();
          if (!response.ok || !data.success) throw new Error(data.error || 'Save failed');
          setSaveMessage("✅ Your card details were saved successfully.");
        } catch (error: any) {
          setSaveMessage("⚠️ Failed to save your card details.");
        }
      };

      saveCardDetails();
      return () => clearTimeout(timer);
    }
  }, [status, user, state]);

  if (!status) return <div className="spinner flex items-center justify-center h-screen">Loading...</div>;
  if (status !== 'succeeded') return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#FAF3E0] py-12 px-6 relative overflow-hidden">
    <Confetti width={window.innerWidth} height={window.innerHeight} />

      {/* 🔥 Firework Animation Lottie */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-60">
        <DotLottieReact
          src="https://lottie.host/8ec1d27e-e58e-4bc4-89b1-f8b6d72812a2/CxvIr3DXRi.lottie"
          autoplay
          loop
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-3xl bg-white border border-[#FFC107]/30 shadow-xl rounded-2xl p-8 text-center">
        {/* 🎉 Success Check */}
        <DotLottieReact
          src="https://lottie.host/f70430c7-a98c-40a9-a082-3216d03a8442/wLdaRh5eir.lottie"
          loop
          autoplay
          className="mx-auto mb-4 w-32 h-32"
        />

        {/* 🏆 Message */}
        <h2 className="text-3xl font-extrabold text-[#8B1E3F] mb-3">
          🎉 Purchase Successful!
        </h2>
        <p className="text-lg font-medium text-[#3E7D4B]">Your delicious meal is on its way 🍛</p>

        {/* 👇 Button */}
        <Link
          to="/menu"
          className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-[#FFC107] to-[#FF9933] text-white text-lg font-bold rounded-full shadow hover:scale-105 transition"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
};

export default Done;
