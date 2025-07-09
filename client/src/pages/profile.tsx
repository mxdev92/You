import { useState, useEffect } from "react";
import { ArrowLeft, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Profile() {
  const { user } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    email: "",
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    // Initialize profile data from Firebase user
    setProfileData({
      email: user.email || "",
      fullName: user.displayName || "",
      phone: "", // Phone will need to be stored in Firestore
    });
  }, [user, setLocation]);

  const handleSave = async () => {
    try {
      // TODO: Save profile data to Firestore
      console.log('Saving profile data:', profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    // Reset to original data
    setProfileData({
      email: user?.email || "",
      fullName: user?.displayName || "",
      phone: "",
    });
    setIsEditing(false);
  };

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
            الملف الشخصي
          </h1>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className="hover:bg-gray-100 rounded-lg"
          >
            {isEditing ? <X className="h-5 w-5" /> : <Edit2 className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 space-y-6"
        >
          {/* Profile Picture Section */}
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-semibold text-green-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {profileData.fullName ? profileData.fullName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              {profileData.fullName || 'المستخدم'}
            </h2>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                disabled={!isEditing}
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                الاسم الكامل
              </label>
              <Input
                type="text"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                disabled={!isEditing}
                placeholder="أدخل اسمك الكامل"
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                رقم الهاتف
              </label>
              <Input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="07XXXXXXXXX"
                className="w-full"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                كلمة المرور
              </label>
              <Button
                variant="outline"
                disabled={!isEditing}
                className="w-full justify-start text-gray-600"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                ••••••••••
              </Button>
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                انقر لتغيير كلمة المرور
              </p>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <Button
                onClick={handleSave}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3"
                style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
              >
                <Save className="h-5 w-5 ml-2" />
                حفظ التغييرات
              </Button>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}