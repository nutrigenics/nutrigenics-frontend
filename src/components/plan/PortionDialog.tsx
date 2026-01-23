import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Recipe } from '@/types';

interface PortionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: PortionData) => void;
    recipe?: Recipe;
    customMealName?: string;
}

export interface PortionData {
    quantity: number;
    unit: string;
    calories?: number; // Calculated or manual
}

export function PortionDialog({ isOpen, onClose, onConfirm, recipe, customMealName }: PortionDialogProps) {
    const [quantity, setQuantity] = useState('1');
    const [unit, setUnit] = useState('serving');

    const handleConfirm = () => {
        onConfirm({
            quantity: parseFloat(quantity) || 1,
            unit,
        });
        setQuantity('1');
        onClose();
    };

    const recipeCalories = recipe?.recipe_nutrient_set?.find(n => n.nutrient.name === 'Calories')?.nutrient_quantity || 0;
    const estimatedCalories = recipeCalories ? (parseFloat(quantity) || 0) * recipeCalories : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle>Add {recipe ? recipe.recipe_name : customMealName || 'Meal'}</DialogTitle>
                    <DialogDescription>
                        How much did you eat?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            Quantity
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="col-span-3 bg-gray-50 border-gray-200"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit" className="text-right">
                            Unit
                        </Label>
                        <Input
                            id="unit"
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="col-span-3 bg-gray-50 border-gray-200"
                            placeholder="e.g., serving, cup, grams"
                        />
                    </div>

                    {recipe && (
                        <div className="text-center text-sm text-gray-500 mt-2">
                            Estimated: <span className="font-bold text-gray-900">{estimatedCalories.toFixed(0)} kcal</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleConfirm} className="bg-gray-900 text-white rounded-xl">Add to Plan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
