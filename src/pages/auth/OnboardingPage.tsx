import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
    Loader2,
    Check,
    ArrowRight,
    ArrowLeft,
    User,
    Calendar,
    Scale,
    Heart,
    Sparkles,
    ChefHat,
    Salad,
    CheckCircle,
    Building2,
    Stethoscope,
    Target,
    Mars,
    Venus
} from 'lucide-react';
import apiClient from '@/services/api.client';
import { authService } from '@/services/auth.service';
import { ModernAuthBackground } from '@/components/auth/ModernAuthBackground';
import { AuthCard } from '@/components/auth/AuthCard';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthFooter } from '@/components/auth/AuthFooter';
import type { DietitianOnboardingData, HospitalOnboardingData } from '@/types';

// Types
interface ReferenceData {
    allergies: { id: number; name: string }[];
    cuisines: { id: number; name: string }[];
    diets: { id: number; name: string }[];
}

type Gender = 'M' | 'F' | null;
type WeightUnit = 'kg' | 'Lb';
type HeightUnit = 'ft.in' | 'cm';
type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';

const ACTIVITY_LEVEL_LABELS = {
    sedentary: 'Mostly sitting',
    light: 'Lightly active',
    moderate: 'Moderately active',
    active: 'Very active',
    very_active: 'Extra active',
} as const;

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    // Use user role if available, otherwise default to empty
    const initialRole = (user?.role && ['patient', 'dietitian', 'hospital'].includes(user.role))
        ? user.role as 'patient' | 'dietitian' | 'hospital'
        : '';

    // Reference data (Patient) moved to existing declaration below

    // Initial role Effect
    useEffect(() => {
        if (user?.role && ['patient', 'dietitian', 'hospital'].includes(user.role)) {
            // Already set via initial state, but ensure sync if user loads late
            if (selectedRole === '') setSelectedRole(user.role as any);
        }
    }, [user]);

    // Role Selection
    const [selectedRole, setSelectedRole] = useState<'patient' | 'dietitian' | 'hospital' | ''>(initialRole);

    // Current step - Start at 1 if role is pre-selected, else 0
    const [currentStep, setCurrentStep] = useState(initialRole ? 1 : 0);

    // --- Patient Form Data ---
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<Gender>(null);
    const [weight, setWeight] = useState<number | ''>('');
    const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
    const [height, setHeight] = useState<number | ''>('');
    const [heightUnit, setHeightUnit] = useState<HeightUnit>('ft.in');
    const [selectedAllergies, setSelectedAllergies] = useState<number[]>([]);
    const [selectedCuisines, setSelectedCuisines] = useState<number[]>([]);
    const [selectedDiets, setSelectedDiets] = useState<number[]>([]);
    const [goal, setGoal] = useState('');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>('');
    const [consentAccepted, setConsentAccepted] = useState(false);

    // --- Dietitian Form Data ---
    const [dietitianData, setDietitianData] = useState<DietitianOnboardingData>({
        fname: '',
        lname: '',
        place: '',
        hospital_id: '',
        hospital_name: ''
    });
    const [hospitalChoice, setHospitalChoice] = useState<'existing' | 'new'>('existing');
    const [hospitalsList, setHospitalsList] = useState<{ id: number, name: string }[]>([]);

    // --- Hospital Form Data ---
    const [hospitalData, setHospitalData] = useState<HospitalOnboardingData>({
        name: '',
        address: '',
        contact_number: '',
        license_number: ''
    });


    // Reference data (Patient)
    const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
    const [loadingReferenceData, setLoadingReferenceData] = useState(false);

    // UI state
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch reference data on mount / role change
    useEffect(() => {
        if (selectedRole === 'patient' && !referenceData) {
            fetchPatientReferenceData();
        } else if (selectedRole === 'dietitian') {
            fetchHospitals();
        }
    }, [selectedRole]);

    const fetchPatientReferenceData = async () => {
        try {
            setLoadingReferenceData(true);
            const response = await authService.getReferenceData();
            setReferenceData(response);
        } catch (err) {
            console.error('Failed to fetch reference data:', err);
            // Use fallback data if API fails
            setReferenceData({
                allergies: [
                    { id: 1, name: 'Gluten' },
                    { id: 2, name: 'Dairy' },
                    { id: 3, name: 'Nuts' },
                    { id: 4, name: 'Eggs' },
                    { id: 5, name: 'Soy' },
                    { id: 6, name: 'Shellfish' },
                    { id: 7, name: 'Fish' },
                    { id: 8, name: 'Wheat' },
                ],
                cuisines: [
                    { id: 1, name: 'Italian' },
                    { id: 2, name: 'Mexican' },
                    { id: 3, name: 'Indian' },
                ],
                diets: [
                    { id: 1, name: 'Vegetarian' },
                    { id: 2, name: 'Vegan' },
                    { id: 3, name: 'Keto' },
                ],
            });
        } finally {
            setLoadingReferenceData(false);
        }
    };

    const fetchHospitals = async () => {
        try {
            const res = await apiClient.get('/api/v1/hospitals/list_active/');
            if (res.data.hospitals) {
                setHospitalsList(res.data.hospitals);
            }
        } catch (err) {
            console.error("Failed to fetch hospitals", err);
        }
    };

    // --- Step Definitions ---
    // Combined steps for all roles. We filter/select based on currentStep acting as index or semantic ID?
    // Using index logic for simpler linear flow.
    // Step 0: Role Selection (Common)
    // Step 1+: Role Specific

    const patientSteps = [
        { id: 'role', title: 'Welcome!', subtitle: 'Choose account type', icon: User },
        { id: 'name', title: 'Who are you?', subtitle: 'Tell us how to identify and reach you', icon: User },
        { id: 'dob', title: 'Date of Birth', subtitle: 'Your age and gender', icon: Calendar },
        { id: 'body', title: 'Body metrics', subtitle: 'Weight and height', icon: Scale },
        { id: 'goal', title: 'Your Health Goal', subtitle: 'Choose your goal and activity level', icon: Target },
        { id: 'allergies', title: 'Any allergies?', subtitle: 'Select all that apply', icon: Heart },
        { id: 'cuisines', title: 'Preferred cuisines', subtitle: 'What do you love to eat?', icon: ChefHat },
        { id: 'diets', title: 'Dietary preferences', subtitle: 'Any special diets?', icon: Salad },
        { id: 'consent', title: 'Almost there!', subtitle: 'Review and accept', icon: Sparkles },
    ];

    const dietitianSteps = [
        { id: 'role', title: 'Welcome!', subtitle: 'Choose account type', icon: User },
        { id: 'details', title: 'Dietitian Profile', subtitle: 'Professional details', icon: Stethoscope },
    ];

    const hospitalSteps = [
        { id: 'role', title: 'Welcome!', subtitle: 'Choose account type', icon: User },
        { id: 'details', title: 'Hospital Details', subtitle: 'Institution profile', icon: Building2 },
    ];

    const getSteps = () => {
        if (selectedRole === 'patient') return patientSteps;
        if (selectedRole === 'dietitian') return dietitianSteps;
        if (selectedRole === 'hospital') return hospitalSteps;
        return patientSteps; // Default to show Role Selection step 0 which is common
    };

    const steps = getSteps();
    const currentStepData = steps[currentStep] || steps[0];

    const canProceed = (): boolean => {
        // Step 0: Role Selection
        if (currentStep === 0) {
            return selectedRole !== '';
        }

        // Dietitian Flow
        if (selectedRole === 'dietitian') {
            if (currentStepData.id === 'details') {
                const baseValid = dietitianData.fname.trim() !== '' && dietitianData.lname.trim() !== '' && dietitianData.place.trim() !== '';
                if (!baseValid) return false;
                if (hospitalChoice === 'existing') return !!dietitianData.hospital_id;
                else return !!dietitianData.hospital_name?.trim();
            }
            return true;
        }

        // Hospital Flow
        if (selectedRole === 'hospital') {
            if (currentStepData.id === 'details') {
                return hospitalData.name.trim() !== '' && hospitalData.address.trim() !== '' && hospitalData.contact_number.trim() !== '';
            }
            return true;
        }


        // Patient Flow
        if (selectedRole === 'patient') {
            switch (currentStepData.id) {
                case 'name':
                    return firstName.trim() !== '' && lastName.trim() !== '';
                case 'dob':
                    return dob !== '' && gender !== null;
                case 'body':
                    return weight !== '' && weight > 0 && height !== '' && height > 0;
                case 'goal':
                    return goal !== '' && activityLevel !== '';
                case 'allergies':
                case 'cuisines':
                case 'diets':
                    return true; // Optional
                case 'consent':
                    return consentAccepted;
                default:
                    return false;
            }
        }
        return false;
    };

    const handleNext = () => {
        setError(null);
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (selectedRole === 'patient' && !consentAccepted) {
            setError('Please accept the terms to continue');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let payload: any;

            if (selectedRole === 'patient') {
                payload = {
                    fname: firstName,
                    lname: lastName,
                    phone_number: phone,
                    address,
                    date_of_birth: dob,
                    gender: gender!,
                    weight: Number(weight),
                    weight_unit: weightUnit,
                    height: Number(height),
                    height_unit: heightUnit,
                    goal: goal,
                    activity_level: activityLevel,
                    allergies: selectedAllergies.map(String),
                    cuisine_preference: selectedCuisines.map(String),
                    diet_preference: selectedDiets.map(String),
                    consent_accepted: consentAccepted
                };
            } else if (selectedRole === 'dietitian') {
                payload = { ...dietitianData };
            } else if (selectedRole === 'hospital') {
                payload = { ...hospitalData };
            }

            await authService.completeOnboarding(payload, selectedRole as any);
            await refreshUser();

            // Navigate based on role
            if (selectedRole === 'patient') navigate('/');
            else if (selectedRole === 'dietitian') navigate('/dietitian/dashboard');
            else if (selectedRole === 'hospital') navigate('/hospital/dashboard');
            else navigate('/');

        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.detail || 'Failed to complete onboarding. Please try again.');
            console.error('Onboarding error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper inputs for Dietitian/Hospital
    const handleDietitianChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setDietitianData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setHospitalData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };


    const toggleSelection = (id: number, current: number[], setter: React.Dispatch<React.SetStateAction<number[]>>) => {
        if (current.includes(id)) {
            setter(current.filter(item => item !== id));
        } else {
            setter([...current, id]);
        }
    };

    const inputClasses = "h-14 bg-white/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-xl text-lg font-medium";

    const SelectableChip = ({ name, selected, onToggle }: { name: string; selected: boolean; onToggle: () => void }) => (
        <button
            type="button"
            onClick={onToggle}
            className={`
                px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 border
                ${selected
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'}
            `}
        >
            {name}
        </button>
    );

    const UnitToggle = ({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) => (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`
                        px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 min-w-[60px]
                        ${value === option.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'}
                    `}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const GenderButton = ({ genderValue, icon, label }: { genderValue: Gender; icon: React.ReactNode; label: string }) => (
        <button
            type="button"
            onClick={() => setGender(genderValue)}
            className={`
                flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all duration-200 relative
                ${gender === genderValue
                    ? 'bg-white border-primary ring-2 ring-logo/20 shadow-lg'
                    : 'bg-white/50 border-gray-200 hover:border-gray-300 hover:bg-white'}
            `}
        >
            {icon}
            <span className="font-medium text-gray-900">{label}</span>
            {gender === genderValue && (
                <div className="absolute top-4 right-4 text-primary">
                    <CheckCircle className="w-5 h-5" />
                </div>
            )}
        </button>
    );

    if (loadingReferenceData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full flex flex-col overflow-hidden">
            <ModernAuthBackground />
            <AuthHeader />

            <div className="w-full h-full flex-1  flex flex-col items-center justify-center p-4 sm:p-6 mt-20 mb-20">
                <AnimatePresence mode="wait">
                    <AuthCard
                        key="auth-card"
                        title={currentStepData.title}
                        subtitle={currentStepData.subtitle}
                        delay={0.1}
                    >
                        {/* Progress Bar (Only for multi-step patient flow or if > 1 step) */}
                        {steps.length > 2 && (
                            <div className="w-full mb-8">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Step {currentStep + 1} of {steps.length}
                                    </span>
                                    <span className="text-xs font-semibold text-primary">
                                        {Math.round(((currentStep + 1) / steps.length) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gray-900 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-100 text-red-600">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >

                                    {/* Step 0: Role Selection */}
                                    {currentStep === 0 && (
                                        <div className="grid gap-4">
                                            <button
                                                onClick={() => setSelectedRole('patient')}
                                                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedRole === 'patient' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-3 bg-green-100 rounded-lg text-green-700"><User className="w-6 h-6" /></div>
                                                <div className="text-left flex-1">
                                                    <h3 className="font-semibold text-gray-900">Patient</h3>
                                                    <p className="text-sm text-gray-500">I want to manage my diet and health</p>
                                                </div>
                                                {selectedRole === 'patient' && <CheckCircle className="w-6 h-6 text-gray-900" />}
                                            </button>

                                            <button
                                                onClick={() => setSelectedRole('dietitian')}
                                                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedRole === 'dietitian' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-3 bg-blue-100 rounded-lg text-blue-700"><Stethoscope className="w-6 h-6" /></div>
                                                <div className="text-left flex-1">
                                                    <h3 className="font-semibold text-gray-900">Clinical Nutritionist</h3>
                                                    <p className="text-sm text-gray-500">I am a certified nutrition professional</p>
                                                </div>
                                                {selectedRole === 'dietitian' && <CheckCircle className="w-6 h-6 text-gray-900" />}
                                            </button>

                                            <button
                                                onClick={() => setSelectedRole('hospital')}
                                                className={`p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${selectedRole === 'hospital' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="p-3 bg-purple-100 rounded-lg text-purple-700"><Building2 className="w-6 h-6" /></div>
                                                <div className="text-left flex-1">
                                                    <h3 className="font-semibold text-gray-900">Hospital</h3>
                                                    <p className="text-sm text-gray-500">Register a medical institution</p>
                                                </div>
                                                {selectedRole === 'hospital' && <CheckCircle className="w-6 h-6 text-gray-900" />}
                                            </button>
                                        </div>
                                    )}

                                    {/* Dietitian Form */}
                                    {selectedRole === 'dietitian' && currentStepData.id === 'details' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                    <Input name="fname" value={dietitianData.fname} onChange={handleDietitianChange} placeholder="Jane" className={inputClasses} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                    <Input name="lname" value={dietitianData.lname} onChange={handleDietitianChange} placeholder="Doe" className={inputClasses} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Location/Place</label>
                                                <Input name="place" value={dietitianData.place} onChange={handleDietitianChange} placeholder="New York, NY" className={inputClasses} />
                                            </div>

                                            <div className="pt-4 border-t border-gray-100">
                                                <label className="block text-sm font-bold text-gray-900 mb-3">Hospital Affiliation</label>
                                                <div className="flex gap-4 mb-4">
                                                    <button type="button" onClick={() => setHospitalChoice('existing')}
                                                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${hospitalChoice === 'existing' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                                        Select Existing
                                                    </button>
                                                    <button type="button" onClick={() => setHospitalChoice('new')}
                                                        className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${hospitalChoice === 'new' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                                        Register New
                                                    </button>
                                                </div>

                                                {hospitalChoice === 'existing' ? (
                                                    <select
                                                        name="hospital_id"
                                                        value={dietitianData.hospital_id}
                                                        onChange={handleDietitianChange}
                                                        className={`w-full ${inputClasses} px-4 appearance-none`}
                                                    >
                                                        <option value="">Select Hospital</option>
                                                        {hospitalsList.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <Input name="hospital_name" value={dietitianData.hospital_name || ''} onChange={handleDietitianChange} placeholder="Enter Hospital Name" className={inputClasses} />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hospital Form */}
                                    {selectedRole === 'hospital' && currentStepData.id === 'details' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name</label>
                                                <Input name="name" value={hospitalData.name} onChange={handleHospitalChange} placeholder="General Medical Center" className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                                <Textarea name="address" value={hospitalData.address} onChange={handleHospitalChange} rows={3} placeholder="123 Healthcare Blvd..." className="bg-white/50 border-gray-200 resize-none rounded-xl" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                                <Input name="contact_number" value={hospitalData.contact_number} onChange={handleHospitalChange} placeholder="+1 (555) 123-4567" className={inputClasses} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">License Number (Optional)</label>
                                                <Input name="license_number" value={hospitalData.license_number || ''} onChange={handleHospitalChange} placeholder="LIC-987654" className={inputClasses} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Patient Steps (Existing Logic) */}
                                    {selectedRole === 'patient' && (
                                        <>
                                            {currentStepData.id === 'name' && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                                        <Input type="text" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClasses} autoFocus />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                                        <Input type="text" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClasses} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-gray-400 font-normal">(optional)</span></label>
                                                        <Input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">City / Address <span className="text-gray-400 font-normal">(optional)</span></label>
                                                        <Textarea
                                                            placeholder="City, state or full address"
                                                            value={address}
                                                            onChange={(e) => setAddress(e.target.value)}
                                                            rows={3}
                                                            className="bg-white/50 border-gray-200 resize-none rounded-xl text-base"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'dob' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                                                        <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClasses} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
                                                        <div className="flex gap-4 relative">
                                                            <GenderButton genderValue="M" icon={<Mars className="w-6 h-6 text-sky-600" />} label="Male" />
                                                            <GenderButton genderValue="F" icon={<Venus className="w-6 h-6 text-rose-600" />} label="Female" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'body' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
                                                        <div className="flex gap-3">
                                                            <Input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value ? parseFloat(e.target.value) : '')} className={`${inputClasses} flex-1`} min="1" step="0.1" />
                                                            <UnitToggle value={weightUnit} options={[{ value: 'kg', label: 'kg' }, { value: 'Lb', label: 'lb' }]} onChange={(v) => setWeightUnit(v as WeightUnit)} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                                                        <div className="flex gap-3">
                                                            <Input type="number" placeholder="5.8" value={height} onChange={(e) => setHeight(e.target.value ? parseFloat(e.target.value) : '')} className={`${inputClasses} flex-1`} min="1" step="0.1" />
                                                            <UnitToggle value={heightUnit} options={[{ value: 'ft.in', label: 'ft' }, { value: 'cm', label: 'cm' }]} onChange={(v) => setHeightUnit(v as HeightUnit)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'goal' && (
                                                <div className="space-y-4">
                                                    <label className="block text-sm font-medium text-gray-700 mb-3">Select your health goal</label>
                                                    <div className="grid gap-3">
                                                        {[
                                                            { value: 'Lose Weight', label: 'Lose Weight', desc: 'Create a caloric deficit and healthy eating habits' },
                                                            { value: 'Maintain Weight', label: 'Maintain Weight', desc: 'Stay at your current healthy weight' },
                                                            { value: 'Gain Muscle', label: 'Gain Muscle', desc: 'Build strength and increase muscle mass' },
                                                            { value: 'Eat Healthier', label: 'Eat Healthier', desc: 'Improve overall nutrition and wellness' },
                                                            { value: 'Manage Condition', label: 'Manage Health Condition', desc: 'Support specific health needs' },
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setGoal(option.value)}
                                                                className={`p-4 rounded-xl border-2 text-left transition-all ${goal === option.value
                                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                                    : 'border-gray-200 hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                <div className="font-semibold text-gray-900">{option.label}</div>
                                                                <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-3">How active are you on most weeks?</label>
                                                        <div className="grid gap-3">
                                                            {[
                                                                { value: 'sedentary', label: 'Mostly sitting', desc: 'Desk work or low movement most days' },
                                                                { value: 'light', label: 'Lightly active', desc: 'Regular walking or light exercise a few times a week' },
                                                                { value: 'moderate', label: 'Moderately active', desc: 'Exercise or active work on several days each week' },
                                                                { value: 'active', label: 'Very active', desc: 'Hard training or physically active work most days' },
                                                            ].map(option => (
                                                                <button
                                                                    key={option.value}
                                                                    type="button"
                                                                    onClick={() => setActivityLevel(option.value as ActivityLevel)}
                                                                    className={`p-4 rounded-xl border-2 text-left transition-all ${activityLevel === option.value
                                                                        ? 'border-primary bg-primary/5 shadow-md'
                                                                        : 'border-gray-200 hover:border-primary/50'
                                                                        }`}
                                                                >
                                                                    <div className="font-semibold text-gray-900">{option.label}</div>
                                                                    <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500">You can change this later in your profile if your routine changes.</p>
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'allergies' && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-4">Select any allergies you have (optional)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {referenceData?.allergies.map(allergy => (
                                                            <SelectableChip key={allergy.id} name={allergy.name} selected={selectedAllergies.includes(allergy.id)} onToggle={() => toggleSelection(allergy.id, selectedAllergies, setSelectedAllergies)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'cuisines' && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-4">Select your favorite cuisines (optional)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {referenceData?.cuisines.map(cuisine => (
                                                            <SelectableChip key={cuisine.id} name={cuisine.name} selected={selectedCuisines.includes(cuisine.id)} onToggle={() => toggleSelection(cuisine.id, selectedCuisines, setSelectedCuisines)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'diets' && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-4">Select any dietary preferences (optional)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {referenceData?.diets.map(diet => (
                                                            <SelectableChip key={diet.id} name={diet.name} selected={selectedDiets.includes(diet.id)} onToggle={() => toggleSelection(diet.id, selectedDiets, setSelectedDiets)} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {currentStepData.id === 'consent' && (
                                                <div className="space-y-6">
                                                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-6 space-y-4">
                                                        <h3 className="font-semibold text-gray-900">Summary</h3>
                                                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Name</p>
                                                                <p className="font-medium text-gray-900">{firstName} {lastName}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">DOB / Gender</p>
                                                                <p className="font-medium text-gray-900">{dob} / {gender === 'M' ? 'Male' : 'Female'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Weight</p>
                                                                <p className="font-medium text-gray-900">{weight} {weightUnit}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Height</p>
                                                                <p className="font-medium text-gray-900">{height} {heightUnit}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Goal</p>
                                                                <p className="font-medium text-gray-900">{goal}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Activity</p>
                                                                <p className="font-medium text-gray-900">
                                                                    {activityLevel
                                                                        ? ACTIVITY_LEVEL_LABELS[activityLevel as keyof typeof ACTIVITY_LEVEL_LABELS]
                                                                        : 'Not provided'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Contact</p>
                                                                <p className="font-medium text-gray-900">{phone || 'Not provided'}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <p className="text-gray-500 text-xs uppercase tracking-wide">Location</p>
                                                                <p className="font-medium text-gray-900">{address || 'Not provided'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 text-sm text-emerald-900">
                                                        <p className="font-semibold">Keep your records useful</p>
                                                        <ul className="mt-2 space-y-1 text-emerald-800">
                                                            <li>Log meals as regularly as you can so your trends stay accurate.</li>
                                                            <li>Update your weight at least once a week if you are tracking progress.</li>
                                                            <li>Add water and symptom updates whenever they matter for your care.</li>
                                                        </ul>
                                                    </div>
                                                    <label className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all mt-0.5 ${consentAccepted ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-500'}`} onClick={() => setConsentAccepted(!consentAccepted)}>
                                                            {consentAccepted && <Check className="w-3.5 h-3.5 text-white" />}
                                                        </div>
                                                        <div className="text-sm text-gray-600 leading-relaxed" onClick={() => setConsentAccepted(!consentAccepted)}>
                                                            I agree to the <a href="/terms" className="text-gray-900 font-medium hover:text-primary link-underline">Terms of Service</a> and{' '}<a href="/privacy" className="text-gray-900 font-medium hover:text-primary link-underline">Privacy Policy</a>.
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                        </>
                                    )}

                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation */}
                            <div className="flex gap-4 pt-4 border-t border-gray-100 mt-6">
                                {currentStep > 0 && (
                                    <Button variant="outline" onClick={handleBack} className="h-14 px-6 bg-white border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <Button
                                    onClick={handleNext}
                                    className="flex-1 h-14 bg-gray-900 text-white hover:bg-gray-800 font-bold rounded-xl shadow-lg shadow-gray-900/10 transition-all group"
                                    disabled={!canProceed() || isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : currentStep === steps.length - 1 ? (
                                        <span className="flex items-center gap-2">
                                            Complete Setup
                                            <Sparkles className="w-5 h-5 text-primary" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Continue
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </AuthCard>
                </AnimatePresence>
            </div>

            <AuthFooter />
        </div>
    );
}
