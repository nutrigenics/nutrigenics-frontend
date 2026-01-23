import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export interface Dietitian {
    id: number;
    user: {
        first_name: string;
        last_name: string;
        email: string;
    };
    fname: string;
    lname: string;
    place?: string;
    hospital_name?: string;
    image?: string;
}

interface DietitianListProps {
    dietitians: Dietitian[];
    onRequest: (id: number) => void;
    isLoading?: boolean;
}

export function DietitianList({ dietitians, onRequest, isLoading }: DietitianListProps) {
    if (dietitians.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">No available dietitians found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dietitians.map((d, i) => (
                <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                >
                    <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />

                        <div className="flex items-start justify-between mb-4">
                            <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                                <AvatarImage src={d.image} alt={`${d.fname} ${d.lname}`} />
                                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                                    {d.fname[0]}{d.lname[0]}
                                </AvatarFallback>
                            </Avatar>
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                                Available
                            </Badge>
                        </div>

                        <h3 className="text-lg font-bold mb-1">{d.fname} {d.lname}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mb-4 gap-2">
                            {d.hospital_name && (
                                <span className="flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {d.hospital_name}
                                </span>
                            )}
                            {d.place && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {d.place}
                                </span>
                            )}
                        </div>

                        <Button
                            onClick={() => onRequest(d.id)}
                            disabled={isLoading}
                            className="w-full rounded-xl gap-2 font-semibold"
                        >
                            <UserPlus className="w-4 h-4" /> Connect
                        </Button>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
}
