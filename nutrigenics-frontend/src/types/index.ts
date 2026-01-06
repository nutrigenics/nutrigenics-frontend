// User types
export interface BaseUser {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    role: 'patient' | 'dietitian' | 'hospital';
}

export interface Patient {
    id: number;
    fname: string;
    lname: string;
    date_of_birth: string;
    gender: string;
    height: number;
    weight: number;
    email: string;
    phone_number?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    health_conditions?: string[];
    activity_level?: string;
    goal?: string;
    profile_image?: string;
    nutrient_targets?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
}

export interface Dietitian {
    id: number;
    fname: string;
    lname: string;
    email: string;
    phone_number?: string;
    specialization?: string;
    license_number?: string;
    hospital?: Hospital;
    verified: boolean;
    profile_image?: string;
    name?: string; // Read-only full name from API
}

export interface Hospital {
    id: number;
    name: string;
    email: string;
    contact_number?: string;
    address?: string;
    license_number?: string;
    verified: boolean;
}

// Recipe types
export interface Nutrient {
    name: string;
    unit: string;
}

export interface RecipeNutrient {
    nutrient: Nutrient;
    nutrient_quantity: number;
    unit: string;
}

export interface RecipeIngredient {
    id: number;
    ingredient_name: string;
    quantity: string;
}

export interface Recipe {
    id: number;
    pk?: number; // Might not always be present in JSON
    recipe_name: string;
    recipe_image?: string;
    recipe_description?: string;
    recipe_instructions?: string; // Detail view uses this
    recipe_time_minutes?: number;
    recipe_steps?: number;

    // Support both List (string[]) and Detail (Object[/]) structures
    recipe_cuisine?: string[] | { id: number; name: string }[];
    cuisine?: { id: number; name: string }[]; // Detail view alias

    recipe_diet?: string[] | { id: number; name: string }[];
    diet?: { id: number; name: string }[]; // Detail view alias

    recipe_meal_type?: string[];

    recipe_nutrient_set?: RecipeNutrient[];
    nutrients?: RecipeNutrient[]; // Detail view alias

    recipe_ingredient_set?: RecipeIngredient[];
    ingredients?: RecipeIngredient[]; // Detail view alias

    is_bookmarked?: boolean;
    is_liked?: boolean;
    likes_count?: number;
    bookmark_counter?: number;
    recipe_yields?: number;
    total_calories?: number;
}

// Plan types
export interface MealPlan {
    id: number;
    recipe?: Recipe;
    recipe_id?: number; // Include recipe_id for reference
    name?: string; // Flattened name
    image?: string; // Flattened image URL
    meal_type: string;
    date: string;
    completed: boolean;
    custom_name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface PlanStatus {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
}

export interface NutrientSummary {
    Calories: number;
    Protein: number;
    Carbohydrates: number;
    Fat: number;
    [key: string]: number;
}

// Analytics types
export interface AnalyticsDataPoint {
    date: string;
    [nutrient: string]: number | string;
}

export interface AnalyticsData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        borderColor?: string;
        backgroundColor?: string;
    }[];
}

// Chat/Message types
export interface Message {
    id: number;
    sender: BaseUser;
    receiver: BaseUser;
    content: string;
    timestamp: string;
    is_read: boolean;
}

export interface ChatSession {
    id: number;
    participant: Patient | Dietitian;
    last_message?: Message;
    unread_count: number;
}

// Dietitian Request types
export interface DietitianRequest {
    id: number;
    dietitian: Dietitian;
    patient: Patient;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    message?: string;
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Form types
export interface LoginFormData {
    email: string;
    password: string;
}

export interface SignupFormData {
    email: string;
    password: string;
    password2: string;
    role: 'patient' | 'dietitian' | 'hospital';
}

export interface PatientOnboardingData {
    fname: string;
    lname: string;
    date_of_birth: string;
    gender: string;
    height: number;
    weight: number;
    phone_number: string;
    dietary_preferences: string[];
    allergies: string[];
    health_conditions: string[];
    activity_level: string;
    goal: string;
}

export interface DietitianOnboardingData {
    fname: string;
    lname: string;
    place: string;
    hospital_id?: number | string;
    hospital_name?: string;
}

export interface HospitalOnboardingData {
    name: string;
    address: string;
    contact_number: string;
    license_number?: string;
}

export type OnboardingFormData = PatientOnboardingData | DietitianOnboardingData | HospitalOnboardingData;

export interface ProfileUpdateFormData {
    fname?: string;
    lname?: string;
    date_of_birth?: string;
    gender?: string;
    height?: number;
    weight?: number;
    phone_number?: string;
    dietary_preferences?: string[];
    allergies?: string[];
    health_conditions?: string[];
    activity_level?: string;
    goal?: string;
    profile_image?: File;
}

export interface DietitianHospitalRequest {
    id: number;
    dietitian: number;
    dietitian_details: Dietitian; // Simplified Dietitian with name/email
    hospital: number;
    hospital_name: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface HospitalDashboardStats {
    hospital: Hospital;
    total_dietitians: number;
    dietitians: Dietitian[];
    pending_requests_count: number;
    pending_requests: {
        id: number;
        dietitian_name: string;
        dietitian_email: string;
        created_at: string;
    }[];
}
