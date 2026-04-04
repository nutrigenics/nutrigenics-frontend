import type { Recipe } from '@/types';

type RecipeLike = Recipe | (Partial<Recipe> & Record<string, unknown>);

type NormalizedNutrient = NonNullable<Recipe['recipe_nutrient_set']>[number];
type NormalizedIngredient = NonNullable<Recipe['recipe_ingredient_set']>[number];

const toNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};

const toString = (value: unknown): string => {
    return typeof value === 'string' ? value : '';
};

const parseSteps = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value
            .map((step) => toString(step).trim())
            .filter(Boolean);
    }

    const raw = toString(value).trim();
    if (!raw) return [];

    const lines = raw
        .split(/\r?\n+/)
        .map((step) => step.trim())
        .filter(Boolean);

    if (lines.length > 1) return lines;

    return raw
        .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
        .map((step) => step.trim())
        .filter(Boolean);
};

const normalizeNutrients = (recipe: RecipeLike): NormalizedNutrient[] => {
    const sources = [
        recipe.recipe_nutrient_set,
        recipe.nutrients,
        recipe.nutrition_facts,
    ];

    const rawList = sources.find(Array.isArray);
    if (!Array.isArray(rawList)) return [];

    return rawList
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const raw = item as Record<string, unknown>;
            const name =
                toString((raw.nutrient as Record<string, unknown> | undefined)?.name) ||
                toString(raw.nutrient_name) ||
                toString(raw.name) ||
                toString(raw.label);

            if (!name) return null;

            const unit =
                toString(raw.unit) ||
                toString((raw.nutrient as Record<string, unknown> | undefined)?.unit);

            return {
                nutrient: {
                    name,
                    unit,
                },
                nutrient_quantity: toNumber(
                    raw.nutrient_quantity ?? raw.amount ?? raw.value
                ),
                unit,
            } satisfies NormalizedNutrient;
        })
        .filter((item): item is NormalizedNutrient => item !== null);
};

const normalizeIngredients = (
    recipe: RecipeLike
): {
    display: Recipe['ingredients'];
    detailed: NormalizedIngredient[];
} => {
    const source = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : Array.isArray(recipe.recipe_ingredient_set)
          ? recipe.recipe_ingredient_set
          : [];

    const display = source
        .map((item, index) => {
            if (typeof item === 'string') return item;
            if (!item || typeof item !== 'object') return null;

            const raw = item as Record<string, unknown>;
            const ingredientName =
                toString(raw.ingredient_name) ||
                toString((raw.ingredient as Record<string, unknown> | undefined)?.name);

            return {
                id: toNumber(raw.id) || index + 1,
                ingredient_name: ingredientName || 'Ingredient',
                quantity: toString(raw.quantity),
            };
        })
        .filter(Boolean) as NonNullable<Recipe['ingredients']>;

    const detailed = display.map((item, index) => {
        if (typeof item === 'string') {
            return {
                id: index + 1,
                ingredient_name: item,
                quantity: '',
            };
        }

        return {
            id: ('id' in item ? toNumber(item.id) : 0) || index + 1,
            ingredient_name: item.ingredient_name || 'Ingredient',
            quantity: item.quantity || '',
        };
    });

    return { display, detailed };
};

const normalizeTags = (recipe: RecipeLike): Recipe['tags'] => {
    const tagSource = (recipe as { tag?: unknown[] }).tag;
    const source: unknown[] = Array.isArray(recipe.tags)
        ? recipe.tags
        : Array.isArray(tagSource)
          ? tagSource
          : [];

    return source
        .map((item) => {
            if (typeof item === 'string') return item;
            if (!item || typeof item !== 'object') return null;

            const raw = item as Record<string, unknown>;
            const name = toString(raw.name);
            if (!name) return null;

            return {
                id: toNumber(raw.id),
                name,
            };
        })
        .filter((item): item is NonNullable<Recipe['tags']>[number] => item !== null);
};

export const getRecipeNutrientEntries = (
    recipe: RecipeLike | null | undefined
): NormalizedNutrient[] => {
    if (!recipe) return [];
    return normalizeNutrients(recipe);
};

export const getRecipeNutrientValue = (
    recipe: RecipeLike | null | undefined,
    nutrientName: string
): number => {
    const target = nutrientName.toLowerCase();

    const match = getRecipeNutrientEntries(recipe).find((entry) => {
        const name = entry.nutrient?.name?.toLowerCase?.() || '';
        return name === target || name.includes(target);
    });

    return match ? toNumber(match.nutrient_quantity) : 0;
};

export const normalizeRecipe = (recipe: RecipeLike): Recipe => {
    const id = toNumber(recipe.id ?? recipe.pk);
    const recipeName = toString(recipe.recipe_name) || toString(recipe.name) || 'Recipe';
    const recipeImage = toString(recipe.recipe_image) || toString(recipe.image);
    const recipeTimeMinutes =
        toNumber(recipe.recipe_time_minutes) ||
        toNumber(toString(recipe.time).replace(/[^\d.]/g, ''));
    const servings = toNumber(recipe.recipe_yields ?? recipe.servings) || 1;
    const instructions = parseSteps(recipe.instructions ?? recipe.recipe_instructions);
    const nutrients = normalizeNutrients(recipe);
    const { display: ingredients, detailed: recipeIngredientSet } = normalizeIngredients(recipe);
    const tags = normalizeTags(recipe);
    const calories =
        toNumber(recipe.calories ?? (recipe as { total_calories?: unknown }).total_calories) ||
        getRecipeNutrientValue({ ...recipe, recipe_nutrient_set: nutrients }, 'Calories') ||
        getRecipeNutrientValue({ ...recipe, recipe_nutrient_set: nutrients }, 'Energy');

    return {
        ...(recipe as Recipe),
        id,
        pk: toNumber(recipe.pk) || id,
        name: toString(recipe.name) || recipeName,
        image: toString(recipe.image) || recipeImage,
        time: toString(recipe.time) || (recipeTimeMinutes ? `${recipeTimeMinutes} min` : ''),
        calories,
        servings,
        ingredients,
        instructions,
        tags,
        recipe_name: recipeName,
        recipe_image: recipeImage,
        recipe_instructions:
            toString(recipe.recipe_instructions) || instructions.join('\n'),
        recipe_time_minutes: recipeTimeMinutes || undefined,
        recipe_yields: servings,
        recipe_ingredient_set: recipeIngredientSet,
        recipe_nutrient_set: nutrients,
        nutrients,
        nutrition_facts: nutrients.map((entry) => ({
            name: entry.nutrient?.name || '',
            label: entry.nutrient?.name || '',
            amount: String(entry.nutrient_quantity ?? 0),
            unit: entry.unit || entry.nutrient?.unit || '',
        })),
        is_bookmarked: Boolean(recipe.is_bookmarked),
        is_liked: Boolean(recipe.is_liked),
    };
};

export const normalizeRecipePayload = <T>(payload: T): T => {
    if (Array.isArray(payload)) {
        return payload.map((recipe) => normalizeRecipe(recipe as RecipeLike)) as T;
    }

    if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { results?: unknown[] }).results)
    ) {
        return {
            ...(payload as Record<string, unknown>),
            results: ((payload as unknown as { results: unknown[] }).results).map((recipe) =>
                normalizeRecipe(recipe as RecipeLike)
            ),
        } as T;
    }

    if (payload && typeof payload === 'object') {
        return normalizeRecipe(payload as RecipeLike) as T;
    }

    return payload;
};
