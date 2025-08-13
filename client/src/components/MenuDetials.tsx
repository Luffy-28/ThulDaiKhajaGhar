import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCartPlus } from '@fortawesome/free-solid-svg-icons';
import type { MenuItem } from '../firebase/types';

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
    <div className="min-h-screen bg-[#F5F6F5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl bg-[#F5F6F5] rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:shadow-xl border border-[#4682B4]/20 hover:border-[#FF2400]">
        {loading ? (
          <p className="text-center text-[#4682B4] p-6 text-lg">Loading item details...</p>
        ) : item ? (
          <>
            {/* Image and Back Button */}
            <div className="relative w-full h-64 md:h-96 overflow-hidden bg-[#F5F6F5]">
              <img
                src={item.image || '/assets/carousel/IMG_1632.jpg'}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 bg-[#FF2400] text-[#F5F6F5] px-4 py-2 rounded-full shadow-md hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Back
              </button>
            </div>

            {/* Item Details */}
            <div className="p-6 lg:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-[#FF2400] mb-2">{item.name}</h1>
                  <p className="text-sm uppercase tracking-wide text-[#4682B4] mb-4">
                    {item.category}
                  </p>
                  <p className="text-[#0A5C36] text-base leading-relaxed mb-6">
                    {item.description}
                  </p>

                  {/* Ingredients */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#FF2400] mb-2">Ingredients</h3>
                    <ul className="list-disc list-inside text-[#0A5C36] space-y-1">
                      {item.ingredients.map((ing, index) => (
                        <li key={index}>{ing}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Nutrition */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#FF2400] mb-2">Nutrition (Approx.)</h3>
                    <ul className="list-disc list-inside text-[#0A5C36] space-y-1">
                      <li>Calories: {item.nutrition.calories} kcal</li>
                      <li>Fat: {item.nutrition.fat}g</li>
                      <li>Protein: {item.nutrition.protein}g</li>
                    </ul>
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="w-full md:w-1/3 bg-[#F5F6F5] p-4 rounded-lg shadow-inner border border-[#4682B4]/20">
                  <p className="text-3xl font-bold text-[#0A5C36] mb-4">${item.price.toFixed(2)}</p>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full flex items-center justify-center gap-2 rounded-md bg-[#FF2400] px-6 py-3 text-lg font-semibold text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300"
                  >
                    <FontAwesomeIcon icon={faCartPlus} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>

            {/* Recommended Items */}
            {recommended.length > 0 && (
              <div className="p-6 lg:p-8 bg-[#F5F6F5] border-t border-[#4682B4]/20">
                <h2 className="text-2xl font-semibold text-[#FF2400] mb-4">Recommended Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommended.map((rec) => (
                    <div
                      key={rec.id}
                      className="group bg-[#F5F6F5] rounded-lg shadow-md cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden border border-[#4682B4]/20 hover:border-[#FF2400]"
                      onClick={() => navigate(`/menu/${rec.id}`)}
                    >
                      <img
                        src={rec.image || '/assets/carousel/IMG_1632.jpg'}
                        alt={rec.name}
                        className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-[#0A5C36]">{rec.name}</h3>
                        <p className="text-md text-[#0A5C36]">${rec.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-[#4682B4] p-6 text-lg">No item found.</p>
        )}
      </div>
    </div>
  );
};

export default MenuDetails;