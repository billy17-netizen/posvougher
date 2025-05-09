import React from 'react';

export default function POSMockup() {
  return (
    <div className="bg-white min-h-screen">
      {/* This is just a mockup for taking a screenshot */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-60 bg-gray-900 text-white border-r-4 border-black h-full">
          <div className="p-4 border-b-2 border-gray-800">
            <h1 className="text-2xl font-bold text-white">POS Vougher</h1>
            <p className="text-gray-400 text-sm">Dashboard</p>
          </div>
          
          <nav className="mt-4">
            <div className="bg-blue-600 text-white p-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="font-medium">Kasir</span>
            </div>
            
            <div className="hover:bg-gray-800 p-3 flex items-center text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Laporan</span>
            </div>
            
            <div className="hover:bg-gray-800 p-3 flex items-center text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Pengguna</span>
            </div>
            
            <div className="hover:bg-gray-800 p-3 flex items-center text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Produk</span>
            </div>
            
            <div className="hover:bg-gray-800 p-3 flex items-center text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span>Transaksi</span>
            </div>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {/* Top Bar */}
          <div className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center border-b-4 border-black">
            <div className="text-xl font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Kasir
            </div>
            
            <div className="flex items-center">
              <span className="mr-4">Toko Sumber Makmur</span>
              <img src="https://via.placeholder.com/32" alt="User" className="w-8 h-8 rounded-full border-2 border-black" />
            </div>
          </div>
          
          {/* Main POS Interface */}
          <div className="flex h-[calc(100vh-56px)]">
            {/* Products Section */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 border-r-4 border-black">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold">Produk</h2>
                    <p className="text-gray-500 text-sm">30 item</p>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-white border-3 border-black shadow-brutal-sm rounded-md p-2 flex items-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input type="text" placeholder="Cari produk..." className="outline-none text-sm" />
                    </div>
                    
                    <select className="bg-white border-3 border-black shadow-brutal-sm rounded-md p-2 text-sm">
                      <option>Semua Kategori</option>
                      <option>Minuman</option>
                      <option>Makanan</option>
                      <option>Snack</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {/* Product 1 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 15.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Es Kopi Susu</h3>
                    <p className="text-xs text-gray-500">15 dalam stok</p>
                  </div>
                </div>
                
                {/* Product 2 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 18.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Es Kopi Gula Aren</h3>
                    <p className="text-xs text-gray-500">8 dalam stok</p>
                  </div>
                </div>
                
                {/* Product 3 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 12.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Es Teh Manis</h3>
                    <p className="text-xs text-gray-500">20 dalam stok</p>
                  </div>
                </div>
                
                {/* Product 4 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 25.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Nasi Goreng</h3>
                    <p className="text-xs text-gray-500">5 dalam stok</p>
                  </div>
                </div>
                
                {/* Product 5 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 22.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Mie Goreng</h3>
                    <p className="text-xs text-gray-500">7 dalam stok</p>
                  </div>
                </div>
                
                {/* Product 6 */}
                <div className="bg-white rounded-md border-3 border-black shadow-brutal-sm hover:shadow-brutal hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="h-32 bg-gray-200 rounded-t-md border-b-3 border-black relative">
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md border-2 border-black">Rp 8.000</div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold">Pisang Goreng</h3>
                    <p className="text-xs text-gray-500">12 dalam stok</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cart Section */}
            <div className="w-1/3 bg-white overflow-hidden flex flex-col">
              <div className="p-4 border-b-4 border-black">
                <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                <p className="text-gray-500 text-sm">3 item</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {/* Cart Item 1 */}
                <div className="flex items-center justify-between mb-4 p-3 border-3 border-black rounded-md shadow-brutal-sm">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md border-2 border-black mr-3"></div>
                    <div>
                      <h3 className="font-bold">Es Kopi Susu</h3>
                      <p className="text-sm text-gray-500">Rp 15.000</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">-</button>
                    <span className="w-8 text-center">2</span>
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">+</button>
                  </div>
                </div>
                
                {/* Cart Item 2 */}
                <div className="flex items-center justify-between mb-4 p-3 border-3 border-black rounded-md shadow-brutal-sm">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md border-2 border-black mr-3"></div>
                    <div>
                      <h3 className="font-bold">Nasi Goreng</h3>
                      <p className="text-sm text-gray-500">Rp 25.000</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">-</button>
                    <span className="w-8 text-center">1</span>
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">+</button>
                  </div>
                </div>
                
                {/* Cart Item 3 */}
                <div className="flex items-center justify-between mb-4 p-3 border-3 border-black rounded-md shadow-brutal-sm">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md border-2 border-black mr-3"></div>
                    <div>
                      <h3 className="font-bold">Pisang Goreng</h3>
                      <p className="text-sm text-gray-500">Rp 8.000</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">-</button>
                    <span className="w-8 text-center">3</span>
                    <button className="w-8 h-8 flex items-center justify-center border-2 border-black rounded-md bg-gray-100">+</button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t-4 border-black mt-auto">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>Rp 79.000</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Pajak (10%):</span>
                    <span>Rp 7.900</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>Rp 86.900</span>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-3 font-bold rounded-md border-3 border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all">
                  Proses Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 