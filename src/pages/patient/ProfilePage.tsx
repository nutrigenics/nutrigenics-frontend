import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Ruler,
  Weight,
  Target,
  Edit2,
  Save,
  X,
  Activity,
  Heart,
  Shield,
  ChefHat,
  Salad,
  AlertTriangle,
  Check,
  Hash,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { WeightLogDialog } from '@/components/profile/WeightLogDialog';

interface RefOption {
  id: number;
  name: string;
}

export default function ProfilePage() {
  const { profile, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showWeightLog, setShowWeightLog] = useState(false);

  const [refData, setRefData] = useState<{
    allergies: RefOption[];
    cuisines: RefOption[];
    diets: RefOption[];
  }>({ allergies: [], cuisines: [], diets: [] });

  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
    allergies: [] as number[],
    cuisine_preference: [] as number[],
    diet_preference: [] as number[],
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchRefs = async () => {
      try {
        const data = await authService.getReferenceData();
        setRefData({
          allergies: data.allergies || [],
          cuisines: data.cuisines || [],
          diets: data.diets || [],
        });
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };
    fetchRefs();
  }, []);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        fname: p.fname || '',
        lname: p.lname || '',
        email: p.email || '',
        phone: p.phone_number || p.phone || '',
        address: p.address || p.place || '',
        dob: p.date_of_birth || p.dob || '',
        gender: p.gender || '',
        height: p.height || '',
        weight: p.weight || '',
        goal: p.goal || '',
        allergies: Array.isArray(p.allergies)
          ? p.allergies.map((a: any) => typeof a === 'object' ? a.id : Number(a))
          : [],
        cuisine_preference: Array.isArray(p.cuisine_preference)
          ? p.cuisine_preference.map((c: any) => typeof c === 'object' ? c.id : Number(c))
          : Array.isArray(p.cuisine_preferences)
            ? p.cuisine_preferences.map((c: any) => typeof c === 'object' ? c.id : Number(c))
            : [],
        diet_preference: Array.isArray(p.diet_preference)
          ? p.diet_preference.map((d: any) => typeof d === 'object' ? d.id : Number(d))
          : Array.isArray(p.dietary_preferences)
            ? p.dietary_preferences.map((d: any) => typeof d === 'object' ? d.id : Number(d))
            : [],
      });
      if (p.image) {
        setPreviewImage(p.image);
      }
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const toggleSelection = (field: 'allergies' | 'cuisine_preference' | 'diet_preference', id: number) => {
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(id)
        ? prev[field].filter((i: number) => i !== id)
        : [...prev[field], id]
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setIsSaving(true);

      const data = new FormData();
      data.append('fname', formData.fname);
      data.append('lname', formData.lname);
      if (formData.phone) data.append('phone_number', formData.phone);
      if (formData.address) data.append('place', formData.address); // Backend expects 'place' for patients
      if (formData.dob) data.append('date_of_birth', formData.dob);
      if (formData.gender) data.append('gender', formData.gender);
      if (formData.height) data.append('height', formData.height);
      if (formData.weight) data.append('weight', formData.weight);
      if (formData.goal) data.append('goal', formData.goal);
      if (profileImage) data.append('image', profileImage);

      // Arrays need to be appended individually for Django ListField or ManyToMany
      formData.allergies.forEach(id => data.append('allergies', id.toString()));
      formData.cuisine_preference.forEach(id => data.append('cuisine_preferences', id.toString())); // Typically plural
      formData.diet_preference.forEach(id => data.append('dietary_preferences', id.toString())); // Backend expects dietary_preferences

      await authService.updateProfile(data);
      await refreshUser?.();
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (password?: string) => {
    try {
      await authService.deleteAccount(password);
      toast.success('Account deleted successfully');

      // Logout and redirect
      await logout?.();
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      const errorMsg = error.response?.data?.error || 'Failed to delete account';
      toast.error(errorMsg);
      throw error; // Re-throw so dialog knows it failed
    }
  };

  // Calculate BMI with proper unit conversion
  const calculateBMI = () => {
    if (!formData.height || !formData.weight) return null;

    const weightInKg = Number(formData.weight);
    let heightInCm = Number(formData.height);

    // Convert ft.in to cm if needed (based on typical height values)
    // Heights > 10 are likely in cm, heights < 10 are likely in feet
    if (heightInCm < 10) {
      // Assume it's in feet, convert to cm (1 ft = 30.48 cm)
      heightInCm = heightInCm * 30.48;
    }

    const heightInM = heightInCm / 100;
    return (weightInKg / Math.pow(heightInM, 2)).toFixed(1);
  };

  const bmi = calculateBMI();

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500', bg: 'bg-blue-100 ' };
    if (bmi < 25) return { label: 'Normal', color: 'text-emerald-500', bg: 'bg-emerald-100 ' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-500', bg: 'bg-amber-100 ' };
    return { label: 'Obese', color: 'text-red-500', bg: 'bg-red-100 ' };
  };

  const patientId = (profile as any)?.patient_id || 'N/A';

  const inputClasses = "bg-muted/50 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 rounded-xl h-12";
  const labelClasses = "text-foreground font-semibold mb-2 block text-sm";

  const SelectionChip = ({
    item,
    isSelected,
    onClick,
    icon: Icon
  }: {
    item: RefOption;
    isSelected: boolean;
    onClick: () => void;
    icon?: any;
  }) => (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: isEditing ? 1.02 : 1 }}
      whileTap={{ scale: isEditing ? 0.98 : 1 }}
      className={cn(
        "relative px-4 py-3 rounded-xl border-2 transition-all duration-300 text-left",
        isSelected
          ? "border-primary bg-primary/10 text-primary shadow-md"
          : "border-border bg-card hover:border-primary/30 text-foreground",
        !isEditing && "cursor-default opacity-80"
      )}
    >
      <div className="flex items-center gap-2">
        {isSelected && <Check className="w-4 h-4 text-primary" />}
        {Icon && !isSelected && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="font-medium text-sm">{item.name}</span>
      </div>
      {isSelected && (
        <motion.div
          layoutId={`chip-bg-${item.id}`}
          className="absolute inset-0 bg-primary/5 rounded-xl -z-10"
        />
      )}
    </motion.button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Hero Header */}
      <Card className="relative overflow-hidden p-6 md:p-8 rounded-xl border-border shadow-sm">

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-white shadow-xl cursor-pointer">
                  <AvatarImage src={previewImage || undefined} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {formData.fname[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label
                    htmlFor="profile-upload"
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-medium text-xs backdrop-blur-sm"
                  >
                    <Edit2 className="w-5 h-5" />
                  </label>
                )}
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground mb-0.5">
                  {formData.fname} {formData.lname}
                </h1>
                <p className="text-muted-foreground font-medium text-sm">{formData.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    <Hash className="w-3 h-3 mr-1" />
                    {patientId}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Button
                      onClick={() => setIsEditing(true)}
                      size="lg"
                      className="font-bold rounded-full"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      size="lg"
                      className="font-bold rounded-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSubmit()}
                      size="lg"
                      className="font-bold rounded-full"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", "bg-blue-100")}>
                  <Ruler className={cn("w-4 h-4", "text-blue-500")} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Height</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[100px]">{formData.height ? `${formData.height} cm` : 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50 relative group cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => setShowWeightLog(true)}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", "bg-emerald-100")}>
                  <Weight className={cn("w-4 h-4", "text-emerald-500")} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    Weight <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  </p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[100px]">{formData.weight ? `${formData.weight} kg` : 'Not set'}</p>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", bmi ? getBmiCategory(Number(bmi)).bg : 'bg-muted')}>
                  <Activity className={cn("w-4 h-4", bmi ? getBmiCategory(Number(bmi)).color : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">BMI</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[100px]">{bmi || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", "bg-purple-100")}>
                  <Target className={cn("w-4 h-4", "text-purple-500")} />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Goal</p>
                  <p className="text-sm font-bold text-foreground truncate max-w-[100px]">{formData.goal || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <WeightLogDialog
        open={showWeightLog}
        onOpenChange={setShowWeightLog}
        currentWeight={formData.weight}
        onSuccess={() => refreshUser?.()} // Refresh profile to show new weight
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full  grid grid-cols-4 h-14 p-1.5 bg-white border  rounded-full mb-2">
          {[
            { value: 'overview', label: 'Overview', icon: User },
            { value: 'health', label: 'Health', icon: Heart },
            { value: 'preferences', label: 'Preferences', icon: Salad },
            { value: 'allergies', label: 'Allergies', icon: Shield },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="p-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white font-semibold text-sm gap-2"
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-0">
          <Card className="p-6 rounded-2xl border-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-primary rounded-xl text-primary-foreground">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fname" className={labelClasses}>First Name</Label>
                  <Input id="fname" name="fname" value={formData.fname} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
                </div>
                <div>
                  <Label htmlFor="lname" className={labelClasses}>Last Name</Label>
                  <Input id="lname" name="lname" value={formData.lname} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
                </div>
                <div>
                  <Label htmlFor="email" className={labelClasses}>Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled className={cn(inputClasses, "opacity-60 cursor-not-allowed")} />
                </div>
                <div>
                  <Label htmlFor="phone" className={labelClasses}>Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
                </div>
                <div>
                  <Label htmlFor="dob" className={labelClasses}>Date of Birth</Label>
                  <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
                </div>
                <div>
                  <Label className={labelClasses}>Gender</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['M', 'F'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => isEditing && setFormData(prev => ({ ...prev, gender: g }))}
                        className={cn(
                          "h-12 rounded-xl border-2 font-semibold transition-all",
                          formData.gender === g
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted/50 hover:border-primary/30",
                          !isEditing && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {g === 'M' ? 'Male' : 'Female'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className={labelClasses}>Address</Label>
                  <Input id="address" name="address" value={formData.address} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
                </div>
              </div>
            </form>

            {/* Danger Zone - Only in Overview Tab */}
            <Card className="border-red-200  bg-red-50/50  mt-8">
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-100  rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 " />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900  mb-1">Danger Zone</h3>
                    <p className="text-sm text-red-700  mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="mt-0">
          <Card className="p-6 rounded-2xl border-border">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
                <Heart className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Health & Body Metrics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="height" className={labelClasses}>Height (cm)</Label>
                <Input id="height" name="height" type="number" value={formData.height} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
              </div>
              <div>
                <Label htmlFor="weight" className={labelClasses}>Weight (kg)</Label>
                <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} disabled={!isEditing} className={inputClasses} />
              </div>

              {/* BMI Display */}
              {bmi && (
                <div className="md:col-span-2">
                  <div className={cn("p-6 rounded-2xl border", getBmiCategory(Number(bmi)).bg, "border-border")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Your BMI</p>
                        <p className={cn("text-4xl font-black", getBmiCategory(Number(bmi)).color)}>{bmi}</p>
                      </div>
                      <Badge className={cn("text-sm font-bold px-4 py-1.5", getBmiCategory(Number(bmi)).bg, getBmiCategory(Number(bmi)).color, "border-0")}>
                        {getBmiCategory(Number(bmi)).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <Label htmlFor="goal" className={labelClasses}>Health Goal</Label>
                <select
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={cn(inputClasses, "w-full px-4")}
                >
                  <option value="">Select your goal</option>
                  <option value="Lose Weight">Lose Weight</option>
                  <option value="Maintain Weight">Maintain Weight</option>
                  <option value="Gain Muscle">Gain Muscle</option>
                  <option value="Eat Healthier">Eat Healthier</option>
                  <option value="Manage Condition">Manage Health Condition</option>
                </select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="mt-0 space-y-6">
          {/* Cuisines */}
          <Card className="p-6 rounded-2xl border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-orange-500 rounded-xl text-white">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Cuisine Preferences</h2>
                <p className="text-sm text-muted-foreground">Select the cuisines you enjoy</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {refData.cuisines.map(item => (
                <SelectionChip
                  key={item.id}
                  item={item}
                  isSelected={formData.cuisine_preference.includes(item.id)}
                  onClick={() => toggleSelection('cuisine_preference', item.id)}
                />
              ))}
              {refData.cuisines.length === 0 && <p className="text-muted-foreground text-sm">Loading cuisines...</p>}
            </div>
          </Card>

          {/* Diets */}
          <Card className="p-6 rounded-2xl border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-green-500 rounded-xl text-white">
                <Salad className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Diet Preferences</h2>
                <p className="text-sm text-muted-foreground">Select your dietary preferences</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {refData.diets.map(item => (
                <SelectionChip
                  key={item.id}
                  item={item}
                  isSelected={formData.diet_preference.includes(item.id)}
                  onClick={() => toggleSelection('diet_preference', item.id)}
                />
              ))}
              {refData.diets.length === 0 && <p className="text-muted-foreground text-sm">Loading diets...</p>}
            </div>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies" className="mt-0">
          <Card className="p-6 rounded-2xl border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-red-500 rounded-xl text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Food Allergies</h2>
                <p className="text-sm text-muted-foreground">Select any allergies you have to ensure safe recipe recommendations</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {refData.allergies.map(item => (
                <SelectionChip
                  key={item.id}
                  item={item}
                  isSelected={formData.allergies.includes(item.id)}
                  onClick={() => toggleSelection('allergies', item.id)}
                  icon={Shield}
                />
              ))}
              {refData.allergies.length === 0 && <p className="text-muted-foreground text-sm">Loading allergies...</p>}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteAccount}
        requirePassword={false}
      />
    </div>
  );
}
