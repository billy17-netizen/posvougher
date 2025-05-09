"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string | null;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch product details
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Get current store ID from localStorage
        const storeId = localStorage.getItem('currentStoreId');
        if (!storeId) {
          throw new Error('No store selected');
        }
        
        const response = await fetch(`/api/products/${id}?storeId=${storeId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Product not found");
          }
          throw new Error("Failed to fetch product details");
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    try {
      // Get current store ID from localStorage
      const storeId = localStorage.getItem('currentStoreId');
      if (!storeId) {
        throw new Error('No store selected');
      }
      
      const response = await fetch(`/api/products/${id}?storeId=${storeId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      
      // Redirect to product list
      router.push("/dashboard/products?deleted=true");
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Product Details</h1>
        </div>
        <div className="dashboard-content">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Product Details</h1>
          <Link href="/dashboard/products" className="btn btn-secondary">
            Back to Products
          </Link>
        </div>
        <div className="dashboard-content">
          <div className="error-alert">
            {error || "Product not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Product Details</h1>
        <div className="header-actions">
          <Link href="/dashboard/products" className="btn btn-secondary">
            Back to Products
          </Link>
          <Link 
            href={`/dashboard/products/edit/${product.id}`}
            className="btn btn-primary"
          >
            Edit Product
          </Link>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="brutalism-card product-detail-card">
          <div className="product-header">
            <h2>{product.name}</h2>
            <div className="product-category">
              <span className="category-badge">{product.category.name}</span>
            </div>
          </div>
          
          <div className="product-detail-grid">
            <div className="product-info">
              <div className="detail-section">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
              
              <div className="detail-section">
                <h3>Price</h3>
                <p className="price">Rp {product.price.toLocaleString()}</p>
              </div>
              
              <div className="detail-section">
                <h3>Stock</h3>
                <p className={`stock ${product.stock < 10 ? 'low-stock' : ''}`}>
                  {product.stock} units
                  {product.stock < 10 && <span className="stock-warning"> (Low stock)</span>}
                </p>
              </div>
              
              <div className="detail-section">
                <h3>Last Updated</h3>
                <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            {product.image && (
              <div className="product-image">
                <img src={product.image} alt={product.name} />
              </div>
            )}
          </div>
          
          <div className="product-actions">
            <button 
              onClick={handleDelete}
              className="btn btn-danger"
            >
              Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 