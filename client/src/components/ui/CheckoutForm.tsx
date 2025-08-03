import React, { useState, useEffect } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import type { MenuItem } from '../../firebase/types';
import { parsePhoneNumberFromString, getCountryCallingCode, getCountries } from 'libphonenumber-js';

interface CheckoutFormProps {
  onPaid: (paymentData: any) => void;
  cartItems: (MenuItem & { quantity: number })[];
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onPaid, cartItems }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+61'); // Default to Australia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; phoneNumber?: string }>({});
  const [countryCodes, setCountryCodes] = useState<string[]>([]);

  // Fetch all country codes from libphonenumber-js metadata
  useEffect(() => {
    const fetchCountryCodes = () => {
      const countries = getCountries();
      const codes = countries.map(country => `+${getCountryCallingCode(country)}`).sort();
      setCountryCodes(codes);
    };
    fetchCountryCodes();
  }, []);

  // Fetch user details from Firestore
  useEffect(() => {
    const fetchUserDetails = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || user.displayName || '');
          setEmail(data.email || user.email || '');
          const phone = data.phoneNumber || '';
          const parsedPhone = parsePhoneNumberFromString(phone);
          if (parsedPhone) {
            setCountryCode(`+${parsedPhone.countryCallingCode}`);
            setPhoneNumber(parsedPhone.nationalNumber || '');
          }
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setMessage('Failed to load user details. Please fill in the form.');
      }
    };

    fetchUserDetails();
  }, []);

  // Validate form inputs
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phoneNumber?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const phone = parsePhoneNumberFromString(fullPhoneNumber);
      if (!phone || !phone.isValid()) {
        newErrors.phoneNumber = 'Invalid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Validate form before proceeding
    if (!validateForm()) {
      setMessage('Please fix the errors in the form.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage('Payment succeeded!');

      // Calculate subtotal and total
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subtotal; // No tax

      // Prepare payment data
      const paymentData = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        subtotal: subtotal.toFixed(2),
        total: total.toFixed(2),
        items: cartItems.map(item => ({
          name: item.name || 'Unknown',
          price: item.price,
          quantity: item.quantity,
          image: item.image || '',
        })),
        paymentMethodId: paymentIntent.payment_method || null,
        paymentStatus: paymentIntent.status,
        createdAt: new Date().toISOString(),
        userDetails: {
          uid: auth.currentUser?.uid || 'Unknown',
          email: email.trim(),
          name: name.trim(),
          phoneNumber: `${countryCode}${phoneNumber.trim()}`,
        },
      };

      // Save to Firebase
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('No user logged in during payment');
          setMessage('Payment succeeded, but no user is logged in.');
          setSubmitting(false);
          onPaid(paymentData);
          return;
        }

        // Update user document
        await setDoc(
          doc(db, 'users', user.uid),
          {
            name: name.trim(),
            email: email.trim(),
            phoneNumber: `${countryCode}${phoneNumber.trim()}`,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        console.log('User details updated in Firestore:', user.uid);

        // Save to users/{userId}/payments/{paymentIntentId}
        await setDoc(doc(db, 'users', user.uid, 'payments', paymentIntent.id), paymentData);
        console.log('Payment details saved to users payments subcollection:', paymentIntent.id);

        // Save to orders/{paymentIntentId}
        await setDoc(doc(db, 'orders', paymentIntent.id), paymentData);
        console.log('Order details saved to orders collection:', paymentIntent.id);

        // Pass paymentData to onPaid for redirection to /done
        onPaid(paymentData);
      } catch (firebaseErr) {
        console.error('Firebase save error:', firebaseErr);
        setMessage('Payment succeeded, but failed to save details to Firebase.');
        onPaid(paymentData); // Proceed to /done even if Firebase fails
      }

      return;
    }

    setMessage(`Payment status: ${paymentIntent?.status ?? 'unknown'}`);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 block w-full md:w-96 h-12 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-1 ${
              errors.name ? 'border-red-500' : ''
            }`}
            placeholder="Enter your name"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 block w-full md:w-96 h-12 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-1 ${
              errors.email ? 'border-red-500' : ''
            }`}
            placeholder="Enter your email"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div className="flex items-center gap-2 mt-1">
            <select
              id="countryCode"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-24 h-12 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-2 py-1"
            >
              {countryCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`flex-1 h-12 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 px-3 py-1 ${
                errors.phoneNumber ? 'border-red-500' : ''
              }`}
              placeholder="Enter your number"
            />
          </div>
          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
        </div>
      </div>
      <div className="border rounded-lg p-4 bg-gray-50">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 transition duration-200"
      >
        {submitting ? 'Processing…' : 'Pay Now'}
      </button>
    </form>
  );
};

export default CheckoutForm;