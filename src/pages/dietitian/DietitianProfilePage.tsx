import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Edit2, Save, X, Award, Building2, ShieldCheck, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DietitianProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    place: '',
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      await dietitianDashboardService.updateProfile(profile.id, {
        fname: formData.fname,
        lname: formData.lname,
        place: formData.place,
      });
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Failed to update profile", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "bg-slate-50 border-slate-200 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 rounded-xl h-12";
  const labelClasses = "text-slate-900 font-bold mb-2 block text-sm";

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Hero Header */}
      <Card className="relative overflow-hidden p-8 md:p-10 rounded-xl border-slate-100 shadow-soft">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 border-4 border-white shadow-xl cursor-pointer">
                  <AvatarFallback className="text-3xl bg-emerald-600 text-white font-bold">
                    {formData.fname?.[0]}{formData.lname?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Image upload placeholder - can implement actual upload later */}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white backdrop-blur-sm">
                    <Edit2 className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                  {formData.fname} {formData.lname}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-slate-500 font-medium">{formData.email}</p>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                    Dietitian
                  </Badge>
                  {profile?.is_approved && (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full md:w-auto">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full md:w-auto">
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="lg"
                      className="font-bold rounded-full shadow-lg bg-primary hover:bg-primary/80 text-white w-full md:w-auto"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 w-full md:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      size="lg"
                      className="font-bold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 flex-1 md:flex-none"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      size="lg"
                      className="font-bold rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white flex-1 md:flex-none"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        'Saving...'
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> Save Changes
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md h-full grid grid-cols-2 p-2 bg-white rounded-2xl mb-6">
          <TabsTrigger
            value="overview"
            className="w-full py-3 rounded-full data-[state=active]:text-white font-bold text-slate-500"
          >
            <User className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger
            value="professional"
            className="w-full py-3 rounded-full data-[state=active]:text-white font-bold text-slate-500"
          >
            <Building2 className="w-4 h-4 mr-2" /> Professional
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <Card className="p-8 rounded-xl border-slate-100 shadow-soft">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="fname" className={labelClasses}>First Name</Label>
                <Input
                  id="fname"
                  name="fname"
                  value={formData.fname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label htmlFor="lname" className={labelClasses}>Last Name</Label>
                <Input
                  id="lname"
                  name="lname"
                  value={formData.lname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={inputClasses}
                />
              </div>
              <div>
                <Label htmlFor="email" className={labelClasses}>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className={cn(inputClasses, "pl-10 opacity-70 cursor-not-allowed bg-slate-100")}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="place" className={labelClasses}>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="place"
                    name="place"
                    value={formData.place}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={cn(inputClasses, "pl-10")}
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional" className="mt-0">
          <Card className="p-8 rounded-xl border-slate-100 shadow-soft">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
                <Award className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Professional Details</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label className={labelClasses}>Affiliated Hospital</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-lg">{profile?.hospital?.name || 'Independent Practice'}</p>
                    <p className="text-sm text-slate-500 font-medium">Your primary affiliation</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className={labelClasses}>Account Status</Label>
                  <Input
                    value={profile?.is_approved ? 'Verified & Approved' : 'Pending Approval'}
                    disabled
                    className={cn(inputClasses, "bg-green-50 text-green-700 border-green-200 font-bold")}
                  />
                </div>
                <div>
                  <Label className={labelClasses}>Dietitian ID</Label>
                  <Input
                    value={`DT-${profile?.id?.toString().padStart(4, '0')}`}
                    disabled
                    className={cn(inputClasses, "bg-slate-100 opacity-70 font-mono")}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
