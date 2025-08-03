import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import type { MenuItem } from '../../firebase/types';

const AdminItemPanel: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const fetchItems = async () => {
    const snap = await getDocs(collection(db, 'MenuItem'));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MenuItem[];
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const uploadImage = async (file: File) => {
    const storageRef = ref(storage, `menuImages/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await addDoc(collection(db, 'MenuItem'), {
        name,
        description,
        price: Number(price),
        category,
        image: imageUrl,
      });
      alert('✅ Item added!');
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to add item.');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      let imageUrl = editingItem.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await updateDoc(doc(db, 'MenuItem', editingItem.id), {
        name,
        description,
        price: Number(price),
        category,
        image: imageUrl,
      });
      alert('✅ Item updated!');
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to update item.');
    }
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (window.confirm(`Delete "${item.name}"?`)) {
      try {
        await deleteDoc(doc(db, 'MenuItem', item.id));
        if (item.image) {
          const imageRef = ref(storage, item.image);
          deleteObject(imageRef).catch(() => {
            console.warn('⚠️ Could not delete image from storage.');
          });
        }
        alert('✅ Item deleted!');
        fetchItems();
      } catch (err) {
        console.error(err);
        alert('❌ Failed to delete item.');
      }
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price);
    setCategory(item.category);
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setPrice(0);
    setCategory('');
    setImageFile(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-teal-700 mb-6 text-center">🍴 Manage Menu Items</h1>

      <form
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md space-y-4"
      >
        <input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="file"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            {editingItem ? 'Update Item' : 'Add Item'}
          </button>
          {editingItem && (
            <button
              type="button"
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded overflow-hidden flex flex-col"
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-48 w-full object-cover"
            />
            <div className="p-4 space-y-1 flex-1">
              <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="font-medium text-green-700">${item.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Category: {item.category}</p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => startEdit(item)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteItem(item)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminItemPanel;
