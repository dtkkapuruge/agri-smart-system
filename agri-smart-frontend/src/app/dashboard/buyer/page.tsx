'use client';

import React, { useEffect, useState } from 'react';
import { Search, ShoppingCart, MapPin, Tag, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  title?: string;
  name?: string;
  grade?: string;
  price: number;
  distance?: string;
  imageUrl?: string;
}

export default function BuyerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    // Backend API එකෙන් Real Products Fetch කිරීම
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [API_URL]);

  const filteredProducts = products.filter((p) =>
    (p.title || p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Buyer Marketplace</h1>
      <p className="text-gray-500 mb-6">Find quality graded crops near you</p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for crops..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Loading Indicator */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading crops from database...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No crops found in the database.
        </div>
      ) : (
        /* Real Product Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="border rounded-xl p-4 shadow-sm bg-white hover:shadow-md transition">
              <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 mb-4 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt="Crop" className="w-full h-full object-cover" />
                ) : (
                  <span>No Image</span>
                )}
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{product.title || product.name || 'Agri Product'}</h3>
                {product.grade && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    Grade {product.grade}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm flex items-center mb-4">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                {product.distance || 'Near Sri Lanka'}
              </p>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-xl font-bold text-green-700">${product.price}/kg</span>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm transition">
                  <ShoppingCart className="h-4 w-4" /> Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}