import React from "react";
import { motion } from "framer-motion";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { getNutrientColor } from "@/utils/nutrition";

interface NutritionGridProps {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    nutrients: {
        label: string;
        value: number;
        unit: string;
    }[];
}

export const NutritionGrid: React.FC<NutritionGridProps> = ({
    calories,
    protein,
    carbs,
    fat,
    nutrients,
}) => {
    const macros = [
        { label: "Protein", value: protein, unit: "g", color: getNutrientColor("protein") },
        { label: "Carbs", value: carbs, unit: "g", color: getNutrientColor("carbs") },
        { label: "Fat", value: fat, unit: "g", color: getNutrientColor("fat") },
    ];

    return (
        <div className="space-y-6">
            {/* Main Macros Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Calories Card */}
                <motion.div
                    whileHover={{ y: -2 }}
                    className="bg-orange-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-orange-100"
                >
                    <span className="text-3xl font-bold text-orange-600 mb-1">
                        {Math.round(calories)}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                        Calories
                    </span>
                </motion.div>

                {/* Macro Circular Progress Cards */}
                {macros.map((macro, index) => (
                    <motion.div
                        key={macro.label}
                        whileHover={{ y: -2 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center shadow-sm"
                    >
                        <div className="mb-2 relative">
                            <CircularProgress
                                value={isNaN(50) ? 0 : 50} // Visual indicator only
                                max={100}
                                size="sm" // Use a valid size string
                                color={macro.color} // Pass the color class correctly
                                showPercentage={false}
                                showTotal={false}
                                showText={false}
                            >
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-gray-700">
                                        {Math.round(macro.value || 0)}{macro.unit}
                                    </span>
                                </div>
                            </CircularProgress>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                            {macro.label}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Nutrients Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {nutrients.map((item, idx) => (
                    <div
                        key={idx}
                        className="w-full p-4 flex item-center justify-center flex-col text-center rounded-xl border border-gray-100"
                    >
                        <div>
                            <span className="text-2xl font-semibold text-gray-900">{item.value}</span> {item.unit}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">
                            {item.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
