import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface Cuisine {
    name: string;
    icon: string;
}

const POPULAR_CUISINES: Cuisine[] = [
    { name: 'Italian', icon: '🍝' },
    { name: 'Mexican', icon: '🌮' },
    { name: 'Asian', icon: '🥢' },
    { name: 'Mediterranean', icon: '🥙' },
    { name: 'Indian', icon: '🍛' },
    { name: 'American', icon: '🍔' }
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
                {POPULAR_CUISINES.map((cuisine, index) => (
                    <Link
                        key={cuisine.name}
                        to={`/recipes?cuisine=${cuisine.name.toLowerCase()}`}
                        className="block h-full"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.03 }}
                            className="h-full"
                        >
                            <Card className="h-full p-6 flex flex-col items-center justify-center text-center gap-3 border-border shadow-sm bg-muted/30 hover:bg-accent hover:border-primary/30 transition-all cursor-pointer rounded-3xl">
                                <div className="text-4xl filter drop-shadow-sm">
                                    {cuisine.icon}
                                </div>
                                <h3 className="font-semibold text-foreground text-sm">
                                    {cuisine.name}
                                </h3>
                            </Card>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
