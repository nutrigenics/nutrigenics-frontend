
import {
    GiHamburger, GiSteak, GiNoodles, GiRoastChicken, GiPineapple,
    GiDumpling, GiPotato, GiCroissant, GiPretzel, GiChiliPepper,
    GiPizzaSlice, GiSushis, GiBowlOfRice, GiTacos, GiOlive,
    GiKebabSpit, GiCookingPot, GiBarbecue, GiCorn,
    GiCakeSlice
} from 'react-icons/gi';
import {
    Leaf, Sprout, Fish, Bone, Shell, Ban, Droplet,
    Cookie, Sunrise, Coffee, Sun, Moon, Utensils,
    Wine, Clock
} from 'lucide-react';
import type { IconType } from 'react-icons';
import type { LucideIcon } from 'lucide-react';

// Union type for any icon component
export type CategoryIcon = IconType | LucideIcon;

// Professional Icon Mappings
export const cuisineIconMap: Record<string, IconType> = {
    'American': GiHamburger,
    'Argentinian': GiSteak,
    'Asian': GiNoodles,
    'British': GiRoastChicken,
    'Caribbean': GiPineapple,
    'Chinese': GiDumpling,
    'Eastern European': GiPotato,
    'French': GiCroissant,
    'German': GiPretzel,
    'Indian': GiChiliPepper,
    'Italian': GiPizzaSlice,
    'Japanese': GiSushis,
    'Korean': GiBowlOfRice,
    'Latin American': GiTacos,
    'Malaysian': GiNoodles,
    'Mediterranean': GiOlive,
    'Mexican': GiTacos,
    'Middle Eastern': GiKebabSpit,
    'Moroccan': GiCookingPot,
    'Russian': GiCookingPot,
    'South African': GiBarbecue,
    'Thai': GiChiliPepper,
    'Turkish': GiKebabSpit,
    'Venezuelan': GiCorn,
    'Vietnamese': GiNoodles,
};

export const dietIconMap: Record<string, LucideIcon> = {
    'Vegetarian': Leaf,
    'Vegan': Sprout,
    'Pescatarian': Fish,
    'Paleo': Bone,
    'Shellfish-Free': Shell,
    'Nut-Free': Ban, // NutOff not available in standard import, using Ban as generic
    'Gluten-Free': Ban,
    'Dairy-Free': Ban,
    'Tomato-Free': Ban,
    'Low-Fat': Droplet,
    'Keto': GiSteak as unknown as LucideIcon, // Using GI icon cast to Lucide for type compatibility if mixed
    'Low-Carb': Cookie,
};

export const mealIconMap: Record<string, LucideIcon> = {
    'breakfast': Sunrise,
    'brunch': Coffee,
    'lunch': Sun,
    'dinner': Moon,
    'dessert': GiCakeSlice as unknown as LucideIcon,
    'appetizers': Utensils,
    'main dish': GiRoastChicken as unknown as LucideIcon,
    'side dish': GiCookingPot as unknown as LucideIcon,
    'snack': Cookie,
    'drinks': Wine
};

export const getCategoryIcon = (type: 'cuisine' | 'diet' | 'meal', name: string): CategoryIcon => {
    const normName = name;
    const lowerName = name.toLowerCase();

    if (type === 'cuisine') {
        return cuisineIconMap[normName] || Utensils;
    }
    if (type === 'diet') {
        return dietIconMap[normName] || Leaf;
    }
    if (type === 'meal') {
        return mealIconMap[lowerName] || Clock;
    }
    return Utensils;
};
