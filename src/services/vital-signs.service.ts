import apiClient from './api.client';

export interface WaterLog {
    id: number;
    patient: number;
    date: string;
    amount_ml: number;
    source: string;
    created_at: string;
}

export interface WaterLogStats {
    total_ml: number;
    target_ml: number;
    logs: WaterLog[];
}

export interface SymptomType {
    id: number;
    name: string;
    category: string;
}

export interface SymptomLog {
    id: number;
    patient: number;
    date: string;
    symptom_type: number;
    symptom_type_details?: SymptomType;
    severity: number;
    notes?: string;
    created_at: string;
}

const vitalSignsService = {
    // Water Logs
    getTodayWater: async () => {
        const response = await apiClient.get<WaterLogStats>('/api/v1/water-logs/today/');
        return response.data;
    },

    addWaterLog: async (amount_ml: number) => {
        const response = await apiClient.post<WaterLog>('/api/v1/water-logs/', {
            date: new Date().toISOString(),
            amount_ml
        });
        return response.data;
    },

    getWaterHistory: async (days: number = 7, patientId?: number | string) => {
        const response = await apiClient.get<any>('/api/v1/water-logs/history/', {
            params: {
                days,
                ...(patientId ? { patient_id: patientId } : {}),
            }
        });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    // Symptoms
    getSymptomTypes: async () => {
        const response = await apiClient.get<any>('/api/v1/symptom-types/');
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    getRecentSymptoms: async (patientId?: number | string) => {
        const response = await apiClient.get<any>('/api/v1/symptom-logs/', {
            params: patientId ? { patient_id: patientId } : undefined
        });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    logSymptom: async (data: { symptom_type: number; severity: number; notes?: string }) => {
        const response = await apiClient.post<SymptomLog>('/api/v1/symptom-logs/', {
            date: new Date().toISOString(),
            ...data
        });
        return response.data;
    },

    // Weight
    logWeight: async (weight: number, unit: string = 'kg') => {
        const response = await apiClient.post('/api/v1/weight-logs/', {
            weight,
            unit,
            date: new Date().toISOString()
        });
        return response.data;
    }
};

export default vitalSignsService;
