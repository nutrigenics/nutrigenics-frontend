import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ChevronRight,
    Pizza,
    Flame,
    Soup,
    Salad,
    Wheat,
    Sandwich,
    type LucideIcon
} from 'lucide-react';

interface Cuisine {
    name: string;
    icon: LucideIcon;
    color: string;
}

const POPULAR_CUISINES: Cuisine[] = [
    { name: 'Italian', icon: Pizza, color: 'text-orange-500' },
    { name: 'Mexican', icon: Flame, color: 'text-red-500' },
    { name: 'Asian', icon: Soup, color: 'text-amber-500' },
    { name: 'Mediterranean', icon: Salad, color: 'text-emerald-500' },
    { name: 'Indian', icon: Wheat, color: 'text-yellow-500' },
    { name: 'American', icon: Sandwich, color: 'text-blue-500' }
];

export function PopularCuisines() {
    return (
        <div className="mb-12">
            <div className="flex items-end justify-between mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Explore Cuisines</h2>
                    <p className="text-muted-foreground font-medium">Discover flavors from around the world</p>
                </div>
                <Link to="/recipes">
                    <Button variant="ghost" className="text-foreground hover:bg-muted font-medium rounded-xl">
                        View All <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {POPULAR_CUISINES.map((cuisine, index) => {
                    const Icon = cuisine.icon;
                    return (
                        <Link
                            key={cuisine.name}
                            to={`/recipes/results?cuisine=${cuisine.name.toLowerCase()}`}
                            className="block h-full"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.03 }}
                                className="h-full"
                            >
                                <Card className="h-full py-8 px-4 flex flex-col items-center justify-center text-center gap-4 border-slate-100 shadow-soft bg-white hover:shadow-soft-lg hover:border-emerald-100 transition-all cursor-pointer rounded-2xl group">
                                    <div className={`p-4 rounded-full bg-slate-50 group-hover:bg-emerald-50 transition-colors duration-300 ${cuisine.color}`}>
                                        <Icon className="w-8 h-8 stroke-[1.5]" />
                                    </div>
                                    <h3 className="font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
                                        {cuisine.name}
                                    </h3>
                                </Card>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
