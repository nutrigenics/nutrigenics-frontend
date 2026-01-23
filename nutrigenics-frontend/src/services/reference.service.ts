/**
 * Reference Data Service
 * Fetches static reference data like allergies, cuisines, diets, and hospitals
 */
import apiClient from './api.client';

export interface Allergy {
    id: number;
    name: string;
}

export interface Cuisine {
    id: number;
    name: string;
}

export interface Diet {
    id: number;
    name: string;
}

export interface HospitalOption {
    id: number;
    name: string;
    address?: string;
    is_verified: boolean;
}

export interface ReferenceData {
    allergies: Allergy[];
    cuisines: Cuisine[];
    diets: Diet[];
}

// Fallback data in case API is unavailable
const FALLBACK_DATA: ReferenceData = {
    allergies: [
        { id: 1, name: 'Gluten' },
        { id: 2, name: 'Dairy' },
        { id: 3, name: 'Nuts' },
        { id: 4, name: 'Eggs' },
        { id: 5, name: 'Soy' },
        { id: 6, name: 'Shellfish' },
        { id: 7, name: 'Fish' },
        { id: 8, name: 'Wheat' },
        { id: 9, name: 'Sesame' },
        { id: 10, name: 'Peanuts' },
    ],
    cuisines: [
        { id: 1, name: 'Italian' },
        { id: 2, name: 'Mexican' },
        { id: 3, name: 'Indian' },
        { id: 4, name: 'Chinese' },
        { id: 5, name: 'Japanese' },
        { id: 6, name: 'Mediterranean' },
        { id: 7, name: 'Thai' },
        { id: 8, name: 'American' },
        { id: 9, name: 'French' },
        { id: 10, name: 'Korean' },
        { id: 11, name: 'Vietnamese' },
        { id: 12, name: 'Greek' },
        { id: 13, name: 'Middle Eastern' },
        { id: 14, name: 'Spanish' },
        { id: 15, name: 'Caribbean' },
    ],
    diets: [
        { id: 1, name: 'Vegetarian' },
        { id: 2, name: 'Vegan' },
        { id: 3, name: 'Keto' },
        { id: 4, name: 'Paleo' },
        { id: 5, name: 'Low-Carb' },
        { id: 6, name: 'Gluten-Free' },
        { id: 7, name: 'Dairy-Free' },
        { id: 8, name: 'Halal' },
        { id: 9, name: 'Kosher' },
        { id: 10, name: 'Pescatarian' },
    ],
};

export const referenceService = {
    /**
     * Get all reference data (allergies, cuisines, diets)
     */
    async getReferenceData(): Promise<ReferenceData> {
        try {
            const response = await apiClient.get('/api/v1/reference-data/');
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch reference data, using fallback:', error);
            return FALLBACK_DATA;
        }
    },

    /**
     * Get list of allergies
     */
    async getAllergies(): Promise<Allergy[]> {
        try {
            const data = await this.getReferenceData();
            return data.allergies;
        } catch (error) {
            console.warn('Failed to fetch allergies:', error);
            return FALLBACK_DATA.allergies;
        }
    },

    /**
     * Get list of cuisines
     */
    async getCuisines(): Promise<Cuisine[]> {
        try {
            const data = await this.getReferenceData();
            return data.cuisines;
        } catch (error) {
            console.warn('Failed to fetch cuisines:', error);
            return FALLBACK_DATA.cuisines;
        }
    },

    /**
     * Get list of diets
     */
    async getDiets(): Promise<Diet[]> {
        try {
            const data = await this.getReferenceData();
            return data.diets;
        } catch (error) {
            console.warn('Failed to fetch diets:', error);
            return FALLBACK_DATA.diets;
        }
    },

    /**
     * Get list of active hospitals for dietitian registration
     */
    async getActiveHospitals(): Promise<HospitalOption[]> {
        try {
            const response = await apiClient.get('/api/v1/hospitals/list_active/');
            return response.data;
        } catch (error) {
            console.warn('Failed to fetch hospitals:', error);
            return [];
        }
    },
};

export default referenceService;
