import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import type { MenuItem } from '../firebase/types';
import '../styles/orderForm.css';

export interface Order {
  id?: string;
  userId?: string;
  name: string;
  phoneNumber: string;
  items: (MenuItem & { quantity: number })[];
  total: number;
  status: string;
  createdAt: Date;
}

const OrderForm: React.FC = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cartItems, setCartItems] = useState<(MenuItem & { quantity: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [userPoints, setUserPoints] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const parsed = JSON.parse(stored);
      setCartItems(parsed);
      const sum = parsed.reduce(
        (acc: number, item: any) => acc + item.price * item.quantity,
        0
      );
      setTotal(sum);
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      const loadUser = async () => {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || '');
          setPhoneNumber(data.phoneNumber || '');
          setUserPoints(data.points || 0);
        }
      };
      loadUser();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) {
      alert('⚠️ Please fill in all fields.');
      return;
    }

    let finalTotal = total;
    let pointsToAdd = total * 1.5;

    const currentUser = auth.currentUser;
    try {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          let currentPoints = snap.data().points || 0;
          let combinedPoints = currentPoints + pointsToAdd;
          let discountSteps = Math.floor(combinedPoints / 1000);
          let discountAmount = discountSteps * 10;

          if (discountAmount > finalTotal) {
            discountAmount = finalTotal;
          }

          finalTotal = finalTotal - discountAmount;
          let usedPoints = discountSteps * 1000;
          let remainingPoints = combinedPoints - usedPoints;

          await updateDoc(userRef, { points: remainingPoints });
          setUserPoints(remainingPoints);
        }
      }

      // Store order in localStorage to use in checkout
      localStorage.setItem(
        "pendingOrder",
        JSON.stringify({
          name,
          phoneNumber,
          items: cartItems,
          total: finalTotal,
        })
      );

      navigate("/Checkout");
    } catch (err: any) {
      console.error('Error preparing checkout:', err);
      alert('❌ Failed to start checkout. Try again.');
    }
  };

  return (
    <div className="order-form-container">
      <h1 className="order-title">Complete Your Order</h1>
      <form onSubmit={handleSubmit} className="order-form">
        <label>
          Name:
          <input
            type="text"
            className="order-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </label>

        <label>
          Phone Number:
          <input
            type="tel"
            className="order-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Your phone number"
            required
          />
        </label>

        <div className="order-summary">
          <h3>Items in your cart:</h3>
          <ul>
            {cartItems.map((item, i) => (
              <li key={i}>
                {item.name} × {item.quantity} = $
                {(item.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
          <p className="order-total">Total: ${total.toFixed(2)}</p>
        </div>

        <button 
       
        type="submit" className="submit-order-button">
          Proceed to Payment
        </button>
      </form>

      {auth.currentUser && (
        <p className="current-points">
          ⭐ You currently have <strong>{userPoints}</strong> points in your account.
        </p>
      )}
    </div>
  );
};

export default OrderForm;
