import apiClient from './api.client';
import type { Recipe } from '../types';
import { normalizeRecipePayload } from '@/utils/recipe';

/**
 * Recipe Service - matches Django backend API v1
 * Base URL: /api/v1/recipes/
 */

export const recipeService = {
    buildQueryParams(params?: {
        cuisine?: string | string[];
        diet?: string | string[];
        meal_type?: string;
        tags?: string | string[];
        max_time?: number;
        min_time?: number;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        if (!params) return undefined;

        const queryParams: Record<string, unknown> = { ...params };

        if (queryParams.meal_type && !queryParams.tags) {
            queryParams.tags = queryParams.meal_type;
        }

        if (Array.isArray(queryParams.cuisine)) {
            queryParams.cuisine = queryParams.cuisine.join(',');
        }
        if (Array.isArray(queryParams.diet)) {
            queryParams.diet = queryParams.diet.join(',');
        }
        if (Array.isArray(queryParams.tags)) {
            queryParams.tags = queryParams.tags.join(',');
        }

        return queryParams;
    },

    /**
     * Get all recipes with optional filters
     * GET /api/v1/recipes/
     */
    async getAllRecipes(params?: {
        cuisine?: string | string[];
        diet?: string | string[];
        meal_type?: string;
        tags?: string | string[];
        max_time?: number;
        min_time?: number;
        search?: string;
        page?: number;
    }) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return {
                count: MOCK_RECIPES.length,
                next: null,
                previous: null,
                results: MOCK_RECIPES
            };
        }
        const response = await apiClient.get('/api/v1/recipes/', {
            params: this.buildQueryParams(params)
        });
        return normalizeRecipePayload(response.data);
    },

    /**
     * Get popular recipes
     * GET /api/v1/recipes/popular/
     */
    async getPopularRecipes(limit: number = 12) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return MOCK_RECIPES.slice(0, limit);
        }
        const response = await apiClient.get('/api/v1/recipes/popular/', {
            params: { limit }
        });
        return normalizeRecipePayload(response.data?.results || response.data);
    },

    /**
     * Get recipe recommendations for current user
     * GET /api/v1/recipes/recommendations/
     */
    async getRecommendations() {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return MOCK_RECIPES.slice(0, 4); // Return top 4 as recommendations
        }
        try {
            const response = await apiClient.get('/api/v1/recipes/recommendations/');
            return normalizeRecipePayload(response.data);
        } catch (error: any) {
            // Return empty array if not authenticated or error occurs
            return [];
        }
    },

    /**
     * Get single recipe by ID
     * GET /api/v1/recipes/{id}/
     */
    async getRecipeById(id: number) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            const recipe = MOCK_RECIPES.find(r => r.id === Number(id));
            if (recipe) return recipe;
            // If not found in mock, user accessed unknown ID in guest mode? Fallback to first.
            return MOCK_RECIPES[0];
        }
        const response = await apiClient.get(`/api/v1/recipes/${id}/`);
        return normalizeRecipePayload(response.data);
    },

    /**
     * Search recipes
     * GET /api/v1/recipes/?search=query
     */
    async searchRecipes(query: string) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            const lowerQ = query.toLowerCase();
            return MOCK_RECIPES.filter(r =>
                r.name.toLowerCase().includes(lowerQ) ||
                r.description?.toLowerCase().includes(lowerQ)
            );
        }
        const response = await apiClient.get('/api/v1/recipes/', {
            params: { search: query }
        });
        return normalizeRecipePayload(response.data.results || response.data);
    },

    /**
     * Filter recipes by various criteria
     * GET /api/v1/recipes/?cuisine=X&diet=Y&max_time=Z
     */
    async filterRecipes(filters: {
        cuisine?: string[];
        diet?: string[];
        meal_types?: string[];
        max_time?: number;
        min_time?: number;
    }) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return MOCK_RECIPES; // Return all for now or implement client filtering if needed
        }
        const response = await apiClient.get('/api/v1/recipes/', {
            params: this.buildQueryParams({
                cuisine: filters.cuisine,
                diet: filters.diet,
                tags: filters.meal_types,
                max_time: filters.max_time,
                min_time: filters.min_time,
            })
        });
        return normalizeRecipePayload(response.data.results || response.data);
    },

    /**
     * Get recipes by meal type (breakfast, lunch, dinner)
     * This uses filtering on the backend
     */
    async getRecipesByMealType(mealType: string) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            const filtered = MOCK_RECIPES.filter(r =>
                r.recipe_meal_type?.includes(mealType.toLowerCase())
            );
            return { data: filtered, results: filtered };
        }
        try {
            // The backend might filter by recipe_meal_type or we fetch all and filter
            const response = await apiClient.get('/api/v1/recipes/', {
                params: this.buildQueryParams({
                    tags: mealType,
                    limit: 20,
                })
            });

            // Client-side filtering by meal type
            const allRecipes = normalizeRecipePayload(response.data.results || response.data);
            const filtered = allRecipes.filter((recipe: Recipe) =>
                recipe.recipe_meal_type?.includes(mealType.toLowerCase())
            );

            return { data: filtered, results: filtered };
        } catch (error: any) {
            return { data: [], results: [] };
        }
    },

    /**
     * Toggle bookmark for a recipe
     * POST /api/v1/recipes/{id}/bookmark/
     */
    async bookmarkRecipe(recipeId: number) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return { status: 'success', is_bookmarked: true }; // Mock success
        }
        try {
            const response = await apiClient.post(`/api/v1/recipes/${recipeId}/bookmark/`);
            return response.data;
        } catch (error: any) {
            // Silently fail if not authenticated
            if (error.response?.status === 401 || error.response?.status === 403) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Toggle like for a recipe
     * POST /api/v1/recipes/{id}/like/
     */
    async likeRecipe(recipeId: number) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return { status: 'success', is_liked: true }; // Mock success
        }
        try {
            const response = await apiClient.post(`/api/v1/recipes/${recipeId}/like/`);
            return response.data;
        } catch (error: any) {
            // Silently fail if not authenticated
            if (error.response?.status === 401 || error.response?.status === 403) {
                return null;
            }
            throw error;
        }
    },

    /**
     * Get available recipe filters (cuisines, diets, meal types)
     * GET /api/v1/recipes/filters/
     */
    async getFilters() {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return {
                cuisines: ["Italian", "Mexican", "Asian", "American"],
                diets: ["Vegetarian", "Vegan", "Keto", "Paleo"],
                meal_types: ["Breakfast", "Lunch", "Dinner", "Snack"]
            };
        }
        try {
            const response = await apiClient.get('/api/v1/recipes/filters/');
            return response.data;
        } catch (error: any) {
            return { cuisines: [], diets: [], meal_types: [] };
        }
    },

    /**
     * Get bookmarked recipes for current user
     */
    async getBookmarkedRecipes() {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return MOCK_RECIPES.filter(r => r.is_bookmarked);
        }
        try {
            const response = await apiClient.get('/api/v1/recipes/bookmarks/');
            return normalizeRecipePayload(response.data);
        } catch (error: any) {
            try {
                // Fallback for now if 404
                const response = await apiClient.get('/api/v1/recipes/');
                const recipes = normalizeRecipePayload(response.data.results || response.data);
                return recipes.filter((r: Recipe) => r.is_bookmarked);
            } catch (e) {
                return [];
            }
        }
    },

    /**
     * Get liked recipes for current user
     * GET /api/v1/recipes/liked/
     */
    async getLikedRecipes() {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            return []; // No liked initially or maybe some
        }
        try {
            const response = await apiClient.get('/api/v1/recipes/liked/');
            return normalizeRecipePayload(response.data);
        } catch (error: any) {
            return [];
        }
    },

    /**
     * Get recipes high in a specific nutrient with fallback
     * GET /api/v1/recipes/high-nutrient/?nutrient=Protein
     */
    async getHighNutrientRecipes(nutrient: string, limit: number = 6) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return { recipes: MOCK_RECIPES.slice(0, limit), usedFallback: false };
        }
        try {
            // Try to get high-nutrient recipes
            const response = await apiClient.get<Recipe[]>(`/api/v1/recipes/high-nutrient/`, {
                params: { nutrient, limit }
            });

            // If we have results, return them
            const normalized = normalizeRecipePayload(response.data);
            if (normalized && normalized.length > 0) {
                return { recipes: normalized, usedFallback: false };
            }

            // Fallback: Get popular recipes instead
            console.log(`No high ${nutrient} recipes found, falling back to popular recipes`);
            const fallbackResponse = await this.getPopularRecipes(limit);
            return {
                recipes: Array.isArray(fallbackResponse) ? fallbackResponse : [],
                usedFallback: true
            };
        } catch (error: any) {
            // On error, try to return popular recipes
            try {
                const fallbackResponse = await this.getPopularRecipes(limit);
                return {
                    recipes: Array.isArray(fallbackResponse) ? fallbackResponse : [],
                    usedFallback: true
                };
            } catch {
                return { recipes: [], usedFallback: true };
            }
        }
    },

    /**
     * Get time-based recipe recommendations with fallback
     * GET /api/v1/recipes/time-based/?meal_type=Breakfast
     */
    async getTimeBasedRecipes(mealType: string, limit: number = 6) {
        if (localStorage.getItem('is_guest_mode') === 'true') {
            const { MOCK_RECIPES } = await import('@/data/mockData');
            return { recipes: MOCK_RECIPES.slice(0, limit), usedFallback: false };
        }
        try {
            // Try to get time-based recipes matching preferences
            const response = await apiClient.get<Recipe[]>('/api/v1/recipes/time-based/', {
                params: { meal_type: mealType, limit }
            });

            // If we have results, return them
            const normalized = normalizeRecipePayload(response.data);
            if (normalized && normalized.length > 0) {
                return { recipes: normalized, usedFallback: false };
            }

            // Fallback: Get popular recipes for any meal type
            console.log(`No ${mealType} recipes found, falling back to popular recipes`);
            const fallbackResponse = await this.getPopularRecipes(limit);
            return {
                recipes: Array.isArray(fallbackResponse) ? fallbackResponse : [],
                usedFallback: true
            };
        } catch (error: any) {
            // On error, try to return popular recipes
            try {
                const fallbackResponse = await this.getPopularRecipes(limit);
                return {
                    recipes: Array.isArray(fallbackResponse) ? fallbackResponse : [],
                    usedFallback: true
                };
            } catch {
                return { recipes: [], usedFallback: true };
            }
        }
    },
};
