// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Building2, MapPin, Shield, Edit2, Camera, Award, Save, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      const updated = await hospitalDashboardService.updateProfile(profile.id, formData);
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
      {/* Hero / Cover */}
      <div className="relative mb-24">
        <div className="h-64 w-full bg-gradient-to-r from-gray-900 to-gray-800 rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <p className="text-9xl font-black text-white tracking-tighter">HOSPITAL</p>
          </div>
        </div>

        {/* Profile Card Overlay */}
        <div className="absolute -bottom-16 left-0 right-0 px-8 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-900/5 max-w-5xl w-full flex flex-col md:flex-row items-center gap-6 border border-gray-100"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <Button size="icon" className="absolute -bottom-2 -right-2 rounded-xl h-10 w-10 bg-gray-900 text-white hover:bg-gray-800 shadow-lg border-2 border-white">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-gray-900 mb-1">{profile?.name}</h1>
              <p className="text-gray-500 font-medium mb-3">Medical Facility • Teaching Hospital</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-3 h-3 mr-1" /> {profile?.address}
                </span>
                <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Shield className="w-3 h-3 mr-1" /> Lic: {profile?.license_number}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <Button
                  className="rounded-xl h-12 px-6 font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-900/10"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              ) : (
                <Button
                  className="rounded-xl h-12 px-6 font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile <Edit2 className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Organization Details
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital Name</label>
                <Input
                  name="name"
                  value={isEditing ? formData.name : profile?.name || ''}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  className={`bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-500'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <Input
                  name="address"
                  value={isEditing ? formData.address : profile?.address || ''}
                  readOnly={!isEditing}
                  onChange={handleInputChange}
                  className={`bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-500'}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  {isEditing ? (
                    <>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                      <Input
                        name="contact_number"
                        value={formData.contact_number || ''}
                        onChange={handleInputChange}
                        className="bg-gray-50 border-gray-200"
                      />
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Phone</p>
                        <p className="text-lg font-bold text-gray-900">{profile?.contact_number || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">License Number</label>
                  <Input
                    name="license_number"
                    value={isEditing ? formData.license_number : profile?.license_number || ''}
                    readOnly={!isEditing}
                    onChange={handleInputChange}
                    className={`bg-gray-50 border-gray-200 ${!isEditing && 'focus-visible:ring-0 text-gray-500'}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" /> Accreditations & Departments
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accreditations</label>
                <div className="flex flex-wrap gap-2">
                  {["JCI Accredited", "Magnet Recognition", "Baby-Friendly"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">{tag}</span>
                  ))}
                  <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-400 text-xs font-bold rounded-full hover:border-gray-400 hover:text-gray-500 transition-colors">+ Add</button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Departments</label>
                <div className="flex flex-wrap gap-2">
                  {["Cardiology", "Oncology", "Pediatrics", "Neurology", "Emergency"].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
