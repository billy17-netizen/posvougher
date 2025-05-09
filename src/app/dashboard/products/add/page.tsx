"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie } from "cookies-next";
import { toast } from "react-hot-toast";

interface Category {
  id: string;
  name: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
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
    // Fetch categories for the dropdown
    const fetchCategories = async () => {
      try {
        setLoading(true);
        
        // Get current store ID from cookie
        const currentStoreId = getCookie('currentStoreId')?.toString();
        if (!currentStoreId) {
          throw new Error('No store selected');
        }
        
        // Set it in the form data
        setFormData(prev => ({
          ...prev,
          storeId: currentStoreId
        }));
        
        const response = await fetch(`/api/categories?storeId=${currentStoreId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

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
      
      // Ensure we have a store ID
      if (!formData.storeId) {
        const currentStoreId = getCookie('currentStoreId')?.toString();
        if (!currentStoreId) {
          setError('No store selected');
          setSubmitting(false);
          return;
        }
        
        formData.storeId = currentStoreId;
      }
      
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }
      
      // Show success toast
      toast.success('Product added successfully');
      
      // Redirect to product list page on success
      router.push('/dashboard/products?added=true');
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
      toast.error('Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Add New Product</h1>
        </div>
        <div className="dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Add New Product</h1>
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
                {submitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 