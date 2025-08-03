import './cartCard.css';
import { FaMinus, FaPlus, FaTimes } from 'react-icons/fa';

interface CartItemProps {
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export default function CartCard({ name, image, price, quantity }: CartItemProps) {
  return (
    <div className="cart-card">
      <input type="checkbox" className="cart-checkbox" />

      <div className="cart-image">
        <img src={image} alt={name} />
      </div>

      <div className="cart-info">
        <div className="cart-header">
          <h2 className="cart-title">{name}</h2>
          <button className="cart-remove">
            <FaTimes />
          </button>
        </div>

        <div className="cart-meta">
          <span>🎂 1–2 yr</span>
          <span>👧 Girl</span>
          <span>🚚 Express in <strong>3 days</strong></span>
        </div>

        <div className="cart-price">${price.toFixed(2)}</div>
      </div>

      <div className="cart-stepper">
        <button><FaMinus size={10} /></button>
        <span>{quantity}</span>
        <button><FaPlus size={10} /></button>
      </div>
    </div>
  );
}
