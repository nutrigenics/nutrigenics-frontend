import { Building2, MapPin, Shield, Edit2, Save, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { hospitalDashboardService } from '@/services/hospital-dashboard.service';
import { toast } from 'sonner';
import type { Hospital } from '@/types';

export default function HospitalProfilePage() {
  const [profile, setProfile] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Hospital>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await hospitalDashboardService.getMe();
      setProfile(data);
      setFormData({
        name: data.name,
        address: data.address,
        contact_number: data.contact_number,
        license_number: data.license_number
      });
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await hospitalDashboardService.updateProfile(profile!.id, formData);
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          Hospital Profile
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-gray-500 mt-1"
        >
          Manage your hospital's information and settings.
        </motion.p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Building2 className="w-7 h-7" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <span className="flex items-center text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  <MapPin className="w-3 h-3 mr-1" /> {profile?.address || 'N/A'}
                </span>
                <span className="flex items-center text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  <Shield className="w-3 h-3 mr-1" /> Lic: {profile?.license_number || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              {isEditing ? (
                <Button
                  className="rounded-xl h-10 px-5 font-medium bg-green-600 text-white hover:bg-green-700"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save
                </Button>
              ) : (
                <Button
                  className="rounded-xl h-10 px-5 font-medium bg-gray-900 text-white hover:bg-gray-800"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Details Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-5 rounded-2xl border-gray-100 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Organization Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital Name</label>
              <Input
                name="name"
                value={isEditing ? formData.name : profile?.name || ''}
                readOnly={!isEditing}
                onChange={handleInputChange}
                className={`h-10 rounded-xl bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-600'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
              <Input
                name="address"
                value={isEditing ? formData.address : profile?.address || ''}
                readOnly={!isEditing}
                onChange={handleInputChange}
                className={`h-10 rounded-xl bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-600'}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</label>
              {isEditing ? (
                <Input
                  name="contact_number"
                  value={formData.contact_number || ''}
                  onChange={handleInputChange}
                  className="h-10 rounded-xl bg-gray-50 border-gray-200"
                />
              ) : (
                <div className="flex items-center gap-2 h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{profile?.contact_number || 'N/A'}</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">License Number</label>
              <Input
                name="license_number"
                value={isEditing ? formData.license_number : profile?.license_number || ''}
                readOnly={!isEditing}
                onChange={handleInputChange}
                className={`h-10 rounded-xl bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-600'}`}
              />
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
}
