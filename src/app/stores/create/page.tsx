'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StoreIcon, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CreateStorePage() {
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxRate: '11',
    currency: 'IDR',
    username: '', // Add username for authentication
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Load user data on mount
  useEffect(() => {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        console.log('Loaded user data for store creation:', user.username);
        setStoreData(prev => ({
          ...prev,
          username: user.username,
        }));
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        // If no valid user data, redirect to login
        router.push('/login');
      }
    } else {
      console.error('No user data found in localStorage');
      // If no user data, redirect to login
      router.push('/login');
    }
  }, [router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStoreData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate store name
    if (!storeData.name.trim()) {
      setError('Nama toko wajib diisi');
      setLoading(false);
      return;
    }
    
    // Make sure username is set
    if (!storeData.username) {
      const userJson = localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          setStoreData(prev => ({
            ...prev,
            username: user.username,
          }));
        } catch (error) {
          console.error('Error retrieving username from localStorage:', error);
          setError('Informasi pengguna tidak tersedia. Silakan login kembali.');
          setLoading(false);
          return;
        }
      } else {
        setError('Anda perlu login terlebih dahulu');
        setLoading(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }
    }
    
    try {
      console.log('Submitting store data:', storeData);
      
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeData),
      });
      
      const responseText = await response.text();
      console.log('Response from server:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response JSON:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to create store');
      }
      
      console.log('Store created successfully:', data.store);
      
      // Show success message and set success state
      setSuccess(true);
      setError(null);
      
      // Show toast notification
      toast.success(data.message || 'Toko berhasil dibuat! Silakan tunggu aktivasi dari admin.');
      
      // Clear form data
      setStoreData({
        name: "",
        address: "",
        phone: "",
        email: "",
        taxRate: "11",
        currency: "IDR",
        username: ""
      });
      
      // After a delay, redirect to the stores page
      setTimeout(() => {
        router.push('/stores');
      }, 5000); // 5 second delay before redirect
      
    } catch (error) {
      console.error('Error creating store:', error);
      setError(error instanceof Error ? error.message : 'Gagal membuat toko baru. Silakan coba lagi.');
      toast.error('Gagal membuat toko. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => router.back()} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold border-b-3 border-brutalism-black pb-2">Buat Toko Baru</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border-3 border-brutalism-red p-4 mb-6 text-red-900">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-3 border-brutalism-green p-4 mb-6 text-green-900">
          <h3 className="font-bold text-lg mb-2">Toko Berhasil Dibuat!</h3>
          <p>Toko baru Anda telah berhasil dibuat dan sedang menunggu aktivasi dari administrator. Anda akan dialihkan ke halaman daftar toko dalam beberapa detik.</p>
        </div>
      )}
      
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-center">
          <div className="w-20 h-20 bg-brutalism-yellow border-3 border-brutalism-black flex items-center justify-center mb-4">
            <StoreIcon size={36} />
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nama Toko"
            name="name"
            value={storeData.name}
            onChange={handleChange}
            required
            placeholder="Masukkan nama toko"
            className="border-3 border-brutalism-black shadow-brutal-xs"
          />
          
          <Input
            label="Alamat"
            name="address"
            value={storeData.address}
            onChange={handleChange}
            placeholder="Masukkan alamat toko"
            className="border-3 border-brutalism-black shadow-brutal-xs"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nomor Telepon"
              name="phone"
              value={storeData.phone}
              onChange={handleChange}
              placeholder="Masukkan nomor telepon"
              className="border-3 border-brutalism-black shadow-brutal-xs"
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={storeData.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              className="border-3 border-brutalism-black shadow-brutal-xs"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">Pajak (%)</label>
              <input
                type="number"
                name="taxRate"
                value={storeData.taxRate}
                onChange={handleChange}
                placeholder="Masukkan persentase pajak"
                className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs"
                min="0"
                step="0.1"
              />
            </div>
            
            <div>
              <label className="block mb-2 font-medium">Mata Uang</label>
              <select
                name="currency"
                value={storeData.currency}
                onChange={handleChange}
                className="w-full p-2 border-3 border-brutalism-black shadow-brutal-xs"
              >
                <option value="IDR">Rupiah (IDR)</option>
                <option value="USD">Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="SGD">Dollar Singapura (SGD)</option>
              </select>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Buat Toko
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 