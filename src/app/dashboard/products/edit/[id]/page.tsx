"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { use } from "react";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  storeId: string;
  category: {
    id: string;
    name: string;
  };
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    categoryId: "",
    storeId: ""
  });

  useEffect(() => {
    // Fetch product data and categories
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current store ID from cookie
        const currentStoreId = getCookie('currentStoreId')?.toString();
        if (!currentStoreId) {
          throw new Error('No store selected');
        }
        
        // Fetch product data
        const productResponse = await fetch(`/api/products/${id}?storeId=${currentStoreId}`);
        if (!productResponse.ok) {
          throw new Error('Failed to fetch product');
        }
        const productData = await productResponse.json();
        
        // Fetch categories for the dropdown
        const categoriesResponse = await fetch(`/api/categories?storeId=${currentStoreId}`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await categoriesResponse.json();
        
        // Set product data to form
        setFormData({
          name: productData.product.name,
          description: productData.product.description,
          price: productData.product.price.toString(),
          stock: productData.product.stock.toString(),
          image: productData.product.image || "",
          categoryId: productData.product.category.id,
          storeId: currentStoreId
        });
        
        setCategories(categoriesData.categories);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      // Validate form data
      if (!formData.name || !formData.description || !formData.price || !formData.stock || !formData.categoryId) {
        setError("Please fill in all required fields");
        setSubmitting(false);
        return;
      }
      
      // Validate numeric fields
      if (isNaN(Number(formData.price)) || isNaN(Number(formData.stock))) {
        setError("Price and stock must be numeric values");
        setSubmitting(false);
        return;
      }
      
      // Get current store ID from cookie if not already in formData
      if (!formData.storeId) {
        const currentStoreId = getCookie('currentStoreId')?.toString();
        if (!currentStoreId) {
          setError('No store selected');
          setSubmitting(false);
          return;
        }
        formData.storeId = currentStoreId;
      }
      
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      // Show success toast
      toast.success('Product updated successfully');
      
      // Redirect to product list page on success
      router.push('/dashboard/products?updated=true');
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
      toast.error('Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Edit Product</h1>
        </div>
        <div className="dashboard-content">
          <p>Loading product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Edit Product</h1>
        <Link href="/dashboard/products" className="btn btn-secondary">
          Back to Products
        </Link>
      </div>
      
      <div className="dashboard-content">
        <div className="brutalism-card form-card">
          {error && (
            <div className="error-alert">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="product-form">
            <div className="input-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Enter product name"
              />
            </div>

            <div className="input-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="input-field"
                rows={4}
                placeholder="Enter product description"
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="price">Price (Rp) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  required
                  className="input-field"
                  placeholder="Enter price"
                />
              </div>

              <div className="input-group">
                <label htmlFor="stock">Stock *</label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="input-field"
                  placeholder="Enter stock quantity"
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="categoryId">Category *</label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="image">Image URL</label>
              <input
                type="text"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter image URL (optional)"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => router.push('/dashboard/products')}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 