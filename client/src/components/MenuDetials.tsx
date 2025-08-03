import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCartPlus } from '@fortawesome/free-solid-svg-icons';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

const MenuDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [recommended, setRecommended] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'MenuItem', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { id: _id, ...data } = docSnap.data() as MenuItem;
          const currentItem = { id: docSnap.id, ...data };
          setItem(currentItem);

          // Fetch recommended items
          const querySnap = await getDocs(collection(db, 'MenuItem'));
          const relatedItems: MenuItem[] = [];
          querySnap.forEach((d) => {
            if (d.id !== id && d.data().category === currentItem.category) {
              const { id: _id, ...rest } = d.data() as MenuItem;
              relatedItems.push({ id: d.id, ...rest });
            }
          });
          setRecommended(relatedItems);
        } else {
          toast.error('Item not found.');
          navigate('/menu');
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
        toast.error('Failed to load item details.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, navigate]);

  const addToCart = (item: MenuItem) => {
    const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const index = existingCart.findIndex((c: any) => c.id === item.id);

    if (index >= 0) {
      existingCart[index].quantity = (existingCart[index].quantity || 1) + 1;
    } else {
      existingCart.push({ ...item, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-500 p-6">Loading item details...</p>
        ) : item ? (
          <>
            {/* Image */}
            <div className="relative w-full h-64 md:h-96 overflow-hidden">
              <img
                src={item.image || '/assets/carousel/IMG_1632.jpg'}
                alt={item.name}
                className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
              />
              <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full hover:bg-opacity-70"
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back
              </button>
            </div>

            {/* Details */}
            <div className="p-6">
              <h1 className="text-3xl font-bold text-teal-700 mb-2">{item.name}</h1>
              <p className="text-sm uppercase tracking-wide text-teal-700/70 mb-4">
                {item.category}
              </p>
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {item.description}
              </p>

              <div className="flex items-center justify-between mb-6">
                <p className="text-2xl font-bold text-green-700">${item.price.toFixed(2)}</p>
                <button
                  onClick={() => addToCart(item)}
                  className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-lg font-semibold text-white hover:bg-teal-700"
                >
                  <FontAwesomeIcon icon={faCartPlus} />
                  Add to Cart
                </button>
              </div>
            </div>

            {/* ✅ Recommended Items */}
            {recommended.length > 0 && (
              <div className="p-6">
                <h2 className="text-xl font-semibold text-teal-700 mb-4">
                  Recommended Items
                </h2>
                <div className="flex overflow-x-auto gap-4 pb-3">
                  {recommended.map((rec) => (
                    <div
                      key={rec.id}
                      className="min-w-[200px] bg-gray-100 rounded-lg shadow cursor-pointer hover:shadow-md transition"
                      onClick={() => navigate(`/menu/${rec.id}`)}
                    >
                      <img
                        src={rec.image || '/assets/carousel/IMG_1632.jpg'}
                        alt={rec.name}
                        className="h-32 w-full object-cover rounded-t-lg"
                      />
                      <div className="p-3">
                        <h3 className="text-sm font-semibold">{rec.name}</h3>
                        <p className="text-xs text-gray-600">${rec.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 p-6">No item found.</p>
        )}
      </div>
    </div>
  );
};

export default MenuDetails;
