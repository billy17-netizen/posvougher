'use client';

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatRupiah } from "@/lib/utils/format";
import { Trash2, Plus, Minus, ShoppingCart, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  // Example products (would normally be fetched from the database)
  const availableProducts = [
    { id: "P001", name: "Kopi Hitam", price: 15000, image: "/coffee.jpg" },
    { id: "P002", name: "Cappuccino", price: 25000, image: "/cappuccino.jpg" },
    { id: "P003", name: "Kue Coklat", price: 20000, image: "/cake.jpg" },
    { id: "P004", name: "Sandwich", price: 30000, image: "/sandwich.jpg" },
    { id: "P005", name: "Nasi Goreng", price: 35000, image: "/fried-rice.jpg" },
    { id: "P006", name: "Es Teh", price: 10000, image: "/ice-tea.jpg" },
  ];

  // Example cart items (would normally be managed with state)
  const cartItems = [
    { id: "P001", name: "Kopi Hitam", price: 15000, quantity: 2, subtotal: 30000 },
    { id: "P003", name: "Kue Coklat", price: 20000, quantity: 1, subtotal: 20000 },
    { id: "P006", name: "Es Teh", price: 10000, quantity: 2, subtotal: 20000 },
  ];

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = Math.round(subtotal * 0.11); // 11% tax
  const total = subtotal + tax;

  // Add state and handler for payment amount
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [changeAmount, setChangeAmount] = useState(0);
  
  // Calculate change amount whenever payment amount changes
  useEffect(() => {
    if (paymentAmount >= total) {
      setChangeAmount(paymentAmount - total);
    } else {
      setChangeAmount(0);
    }
  }, [paymentAmount, total]);

  // Handle process payment
  const handleProcessPayment = async () => {
    if (paymentAmount < total) {
      setErrorMessage("Jumlah bayar tidak boleh kurang dari total");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      // In a real app, we would get the current user ID and store ID
      const cashierUserId = "example-user-id"; // This would come from authentication context
      const storeId = "example-store-id"; // This would come from store context
      
      // Prepare transaction items
      const items = cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }));
      
      // Ensure amounts are integers
      const amountPaidInt = Math.round(paymentAmount);
      const changeAmountInt = Math.round(changeAmount);
      
      // Create transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          totalAmount: total,
          amountPaid: amountPaidInt,
          changeAmount: changeAmountInt,
          paymentMethod,
          cashierUserId,
          storeId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process transaction");
      }
      
      // On success, redirect to transaction detail page
      router.push(`/dashboard/transactions/${data.transactionId}`);
      
    } catch (error) {
      console.error("Transaction error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Transaksi Baru</h1>

      {errorMessage && (
        <div className="p-4 bg-red-50 border-3 border-brutalism-red text-red-700 flex items-start">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Produk" />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="border-3 border-brutalism-black bg-white p-4 shadow-brutal-sm hover:shadow-none hover:translate-y-1 transition-transform cursor-pointer"
                  >
                    <div className="h-24 bg-gray-200 mb-2 border-2 border-brutalism-black flex items-center justify-center">
                      <span className="text-gray-500">Gambar</span>
                    </div>
                    <h3 className="font-bold">{product.name}</h3>
                    <p className="text-brutalism-blue font-medium">{formatRupiah(product.price)}</p>
                    <button className="w-full mt-2 px-2 py-1 bg-brutalism-yellow border-2 border-brutalism-black font-medium flex items-center justify-center gap-1">
                      <Plus size={16} /> Tambah
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div>
          <Card>
            <CardHeader title="Keranjang" />
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center border-b-2 border-brutalism-black pb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm">{formatRupiah(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="w-6 h-6 flex items-center justify-center bg-brutalism-blue text-white border-2 border-brutalism-black">
                        <Minus size={14} />
                      </button>
                      <span className="font-medium w-6 text-center">{item.quantity}</span>
                      <button className="w-6 h-6 flex items-center justify-center bg-brutalism-blue text-white border-2 border-brutalism-black">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="ml-4 font-medium w-24 text-right">
                      {formatRupiah(item.subtotal)}
                    </div>
                    <button className="ml-2 text-brutalism-red">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {cartItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Keranjang kosong. Tambahkan produk untuk memulai transaksi.
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t-2 border-brutalism-black">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak (11%)</span>
                      <span className="font-medium">{formatRupiah(tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatRupiah(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Metode Pembayaran</label>
                  <select 
                    className="w-full p-2 border-3 border-brutalism-black"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">Tunai</option>
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Kredit</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Bayar</label>
                  <Input 
                    placeholder="0" 
                    type="number" 
                    value={paymentAmount === 0 ? '' : paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  />
                </div>
              </div>
              
              {paymentAmount > 0 && (
                <div className="w-full mb-4 p-4 bg-gray-50 border-3 border-brutalism-black">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Kembalian</span>
                    <span>{formatRupiah(changeAmount)}</span>
                  </div>
                </div>
              )}

              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                className="flex items-center justify-center gap-2"
                disabled={paymentAmount < total || isSubmitting}
                onClick={handleProcessPayment}
              >
                {isSubmitting ? (
                  "Memproses..."
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Proses Pembayaran
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 