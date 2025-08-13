"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebase/config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import type { MenuItem } from "../../firebase/types";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/alert-dialog"; // adjust path

const fallbackImage = "/fallback.jpg";

const AdminItemPanel: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [calories, setCalories] = useState<number | "">("");
  const [fat, setFat] = useState<number | "">("");
  const [protein, setProtein] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Alert dialog states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  // Delete confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Cancel edit confirmation states
  const [cancelOpen, setCancelOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  const fetchItems = async () => {
    const snap = await getDocs(collection(db, "MenuItem"));
    const data = snap.docs.map((d) => {
      const docData = d.data() as Partial<MenuItem>;
      return {
        id: d.id,
        name: docData.name || "",
        price: docData.price || 0,
        description: docData.description || "",
        category: docData.category || "",
        ingredients: Array.isArray(docData.ingredients)
          ? docData.ingredients
          : [],
        nutrition: docData.nutrition || {
          calories: 0,
          fat: 0,
          protein: 0,
        },
        image: docData.image || "",
      } as MenuItem;
    });
    setItems(data);
    setCategories(
      Array.from(new Set(data.map((item) => item.category).filter(Boolean)))
    );
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const uploadImage = async (file: File) => {
    const storageRef = ref(storage, `menuImages/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      await addDoc(collection(db, "MenuItem"), {
        name,
        description,
        price: Number(price) || 0,
        category,
        ingredients: ingredients.split(",").map((i) => i.trim()),
        nutrition: {
          calories: Number(calories) || 0,
          fat: Number(fat) || 0,
          protein: Number(protein) || 0,
        },
        image: imageUrl,
      });
      showAlert("Success", "Item added successfully!");
      resetForm();
      fetchItems();
    } catch {
      showAlert("Error", "Failed to add item.");
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
      await updateDoc(doc(db, "MenuItem", editingItem.id), {
        name,
        description,
        price: Number(price) || 0,
        category,
        ingredients: ingredients.split(",").map((i) => i.trim()),
        nutrition: {
          calories: Number(calories) || 0,
          fat: Number(fat) || 0,
          protein: Number(protein) || 0,
        },
        image: imageUrl,
      });
      showAlert("Success", "Item updated successfully!");
      resetForm();
      fetchItems();
    } catch {
      showAlert("Error", "Failed to update item.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, "MenuItem", itemToDelete.id));
      if (itemToDelete.image) {
        const imageRef = ref(storage, itemToDelete.image);
        deleteObject(imageRef).catch(() => {});
      }
      showAlert("Success", "Item deleted successfully!");
      fetchItems();
    } catch {
      showAlert("Error", "Failed to delete item.");
    } finally {
      setConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const startEdit = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price);
    setCategory(item.category);
    setIngredients(item.ingredients.join(", "));
    setCalories(item.nutrition.calories);
    setFat(item.nutrition.fat);
    setProtein(item.nutrition.protein);
    setPreviewImage(item.image);
    setImageFile(null);
  };

  const resetForm = () => {
    setEditingItem(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setIngredients("");
    setCalories("");
    setFat("");
    setProtein("");
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    } else {
      setPreviewImage(null);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-[#F5F6F5] min-h-screen">
      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{itemToDelete?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Edit Confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Editing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel editing this item? Unsaved changes
              will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelOpen(false)}>
              Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setCancelOpen(false);
                resetForm();
              }}
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Form */}
      <form
        onSubmit={editingItem ? handleUpdateItem : handleAddItem}
        className="max-w-2xl mx-auto bg-white p-6 rounded shadow-md space-y-4 border border-[#4682B4]"
      >
        <input
          type="text"
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-[#4682B4] rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-[#4682B4] rounded"
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full p-2 border border-[#4682B4] rounded"
          required
        />

        {/* Category field (no numbers) */}
        <input
          type="text"
          list="categoryList"
          placeholder="Category"
          value={category}
          onChange={(e) => {
            const value = e.target.value;
            if (!/\d/.test(value)) {
              setCategory(value);
            }
          }}
          className="w-full p-2 border border-[#4682B4] rounded"
          required
        />
        <datalist id="categoryList">
          {categories.map((cat, idx) => (
            <option key={idx} value={cat} />
          ))}
        </datalist>

        <input
          type="text"
          placeholder="Ingredients (comma-separated)"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          className="w-full p-2 border border-[#4682B4] rounded"
        />

        <div className="grid grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="Calories"
            value={calories}
            onChange={(e) =>
              setCalories(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="p-2 border border-[#4682B4] rounded"
          />
          <input
            type="number"
            placeholder="Fat (g)"
            value={fat}
            onChange={(e) =>
              setFat(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="p-2 border border-[#4682B4] rounded"
          />
          <input
            type="number"
            placeholder="Protein (g)"
            value={protein}
            onChange={(e) =>
              setProtein(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="p-2 border border-[#4682B4] rounded"
          />
        </div>

        {/* Image Upload */}
        <div
          className="flex flex-col items-center border-2 border-dashed border-[#4682B4] p-4 rounded cursor-pointer hover:border-[#FF2400] transition"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <FontAwesomeIcon
            icon={faUpload}
            className="text-[#4682B4] text-3xl mb-2"
          />
          <p className="text-sm text-gray-600">Click to upload image</p>
          <input
            id="fileInput"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="mt-3 h-32 w-32 object-cover rounded shadow"
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-[#FF2400] text-white px-4 py-2 rounded hover:bg-[#FFC107] hover:text-[#0A5C36] transition"
          >
            {editingItem ? "Update Item" : "Add Item"}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="bg-[#4682B4] text-white px-4 py-2 rounded hover:bg-[#FFC107] transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Items list with search */}
      <h2 className="text-2xl font-semibold text-[#FF2400] mt-10 mb-4">
        Current Menu Items
      </h2>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search menu items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full md:w-1/2 p-2 mb-6 border border-[#4682B4] rounded"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded overflow-hidden flex flex-col border border-[#4682B4] hover:border-[#FF2400] transition"
          >
            <img
              src={item.image || fallbackImage}
              alt={item.name}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
              className="h-48 w-full object-cover"
            />
            <div className="p-4 space-y-1 flex-1">
              <h3 className="text-lg font-bold text-[#FF2400]">{item.name}</h3>
              <p className="text-sm">{item.description}</p>
              <p className="font-medium">${item.price.toFixed(2)}</p>
              <p className="text-sm text-[#4682B4]">
                Category: {item.category}
              </p>
              <p className="text-sm">
                Ingredients:{" "}
                {Array.isArray(item.ingredients)
                  ? item.ingredients.join(", ")
                  : "N/A"}
              </p>
              <p className="text-sm">
                Nutrition:{" "}
                {item.nutrition
                  ? `${item.nutrition.calories} cal, ${item.nutrition.fat}g fat, ${item.nutrition.protein}g protein`
                  : "N/A"}
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[#4682B4]">
              <button
                onClick={() => startEdit(item)}
                className="bg-[#FFC107] px-3 py-1 rounded text-sm hover:bg-[#FF2400] hover:text-white transition"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setItemToDelete(item);
                  setConfirmOpen(true);
                }}
                className="bg-[#FF2400] text-white px-3 py-1 rounded text-sm hover:bg-[#0A5C36] transition"
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
