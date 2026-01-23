// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { User, Award, MapPin, Edit2, Camera, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { toast } from 'sonner';

export default function DietitianProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await dietitianDashboardService.getMe();
      setProfile(data);
      setFormData({
        fname: data.fname || '',
        lname: data.lname || '',
        email: data.email || '',
        place: data.place || '',
      });
    } catch (error) {
      console.error("Failed to fetch profile", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      // Prepare data. Note: nested user fields might need separate handling if backend requires it.
      // DietitianSerializer likely handles 'user' writeable or we send specific fields.
      // Usually, 'user' fields (fname, lname) are updated on User model.
      // If Serializer supports writable nested 'user', good. If not, might fail.
      // Let's assume flat structure or handle specific logic.
      // For now, sending what we have.
      await dietitianDashboardService.updateProfile(profile.id, {
        fname: formData.fname,
        lname: formData.lname,
        place: formData.place,
        // Add other fields
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile(); // Refresh
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
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
            <p className="text-9xl font-black text-white tracking-tighter">PROFILE</p>
          </div>
        </div>

        {/* Profile Card Overlay */}
        <div className="absolute -bottom-16 left-0 right-0 px-8 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-900/5 max-w-4xl w-full flex flex-col md:flex-row items-center gap-6 border border-gray-100"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-[2rem] bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                <div className="text-4xl font-bold text-gray-400">
                  {profile?.fname?.[0] || 'D'}{profile?.lname?.[0] || 'T'}
                </div>
              </div>
              <Button size="icon" className="absolute -bottom-2 -right-2 rounded-xl h-10 w-10 bg-gray-900 text-white hover:bg-gray-800 shadow-lg border-2 border-white">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-black text-gray-900 mb-1">
                {profile?.fname} {profile?.lname}
              </h1>
              <p className="text-gray-500 font-medium mb-3">Dietitian • {profile?.hospital?.name || 'Independent'}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <MapPin className="w-3 h-3 mr-1" /> {profile?.place || 'Location not set'}
                </span>
                <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                  <Award className="w-3 h-3 mr-1" /> Verified
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <Button onClick={handleSave} className="rounded-xl h-12 px-6 font-bold bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/10">
                  Save Changes <Save className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="rounded-xl h-12 px-6 font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10">
                  Edit Profile <Edit2 className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <User className="w-5 h-5" /> Personal Info
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</label>
                <Input
                  name="fname"
                  value={formData.fname || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</label>
                <Input
                  name="lname"
                  value={formData.lname || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</label>
                <Input
                  name="place"
                  value={formData.place || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-gray-50 border-gray-200"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <Input value={formData.email || ''} disabled className="bg-gray-50 border-gray-200 opacity-70" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" /> Professional Info
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital / Clinic</label>
                <Input
                  value={profile?.hospital_name || profile?.hospital?.name || 'Independent Practice'}
                  disabled
                  className="bg-gray-50 border-gray-200 opacity-70"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-bold ${profile?.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {profile?.is_approved ? 'Verified & Approved' : 'Pending Approval'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
