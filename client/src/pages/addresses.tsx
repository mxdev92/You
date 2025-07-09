import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Edit2, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getUserAddresses, addUserAddress, deleteUserAddress, type UserAddress } from "@/lib/firebase-user-data";

export default function Addresses() {
  const { user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    governorate: "",
    district: "",
    landmark: ""
  });

  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    loadAddresses();
  }, [user, setLocation]);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const userAddresses = await getUserAddresses();
      setAddresses(userAddresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const handleSaveAddress = async () => {
    if (!user || !newAddress.name || !newAddress.phone || !newAddress.governorate || !newAddress.district || !newAddress.landmark) {
      return;
    }

    try {
      await addUserAddress({
        governorate: newAddress.governorate,
        district: newAddress.district,
        neighborhood: newAddress.landmark,
        isDefault: false
      });
      await loadAddresses();
      setNewAddress({ name: "", phone: "", governorate: "", district: "", landmark: "" });
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await deleteUserAddress(addressId);
      await loadAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const governorates = [
    "بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كربلاء", "الأنبار", "دهوك", "القادسية", "بابل",
    "كركوك", "واسط", "صلاح الدين", "المثنى", "ذي قار", "ميسان", "السليمانية", "ديالى"
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          
          <h1 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
            عناوين التوصيل
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAddingNew(true)}
            className="hover:bg-gray-100 rounded-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Add New Address Form */}
        <AnimatePresence>
          {isAddingNew && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow-sm p-4 space-y-4"
            >
              <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                إضافة عنوان جديد
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <Input
                  placeholder="اسم المستلم"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
                
                <Input
                  placeholder="رقم الهاتف"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
                
                <select
                  value={newAddress.governorate}
                  onChange={(e) => setNewAddress({ ...newAddress, governorate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((gov) => (
                    <option key={gov} value={gov}>{gov}</option>
                  ))}
                </select>
                
                <Input
                  placeholder="المنطقة"
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
                
                <Input
                  placeholder="أقرب نقطة دالة"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveAddress}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  حفظ العنوان
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewAddress({ name: "", phone: "", governorate: "", district: "", landmark: "" });
                  }}
                  className="flex-1"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  إلغاء
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Addresses List */}
        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                لا توجد عناوين محفوظة
              </p>
              <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                أضف عنوان توصيل لتسهيل عملية الطلب
              </p>
            </div>
          ) : (
            addresses.map((address, index) => (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {address.name}
                    </h4>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {address.phone}
                    </p>
                    <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {address.governorate} - {address.district} - {address.neighborhood}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-gray-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAddress(address.id)}
                      className="hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}