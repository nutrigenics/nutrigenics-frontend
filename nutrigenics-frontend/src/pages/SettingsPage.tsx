import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Shield, User, Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Role-specific notification settings
const notificationSettings = {
    patient: [
        { id: 'email', label: 'Email Notifications', description: 'Receive daily summaries and updates' },
        { id: 'meals', label: 'Meal Reminders', description: "Get notified when it's time to eat" },
        { id: 'dietitian', label: 'Dietitian Messages', description: 'Alerts when your dietitian sends a message' },
    ],
    dietitian: [
        { id: 'email', label: 'Email Notifications', description: 'Receive daily summaries and updates' },
        { id: 'patient_requests', label: 'Patient Requests', description: 'Alerts when patients request connection' },
        { id: 'patient_messages', label: 'Patient Messages', description: 'Notifications for new patient messages' },
    ],
    hospital: [
        { id: 'registration_requests', label: 'Registration Requests', description: 'Alerts when dietitians request to join your hospital' },
    ],
};

export default function SettingsPage() {
    const { user, profile } = useAuth();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Profile form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Notification settings state - dynamic based on role
    const [notifStates, setNotifStates] = useState<Record<string, boolean>>({});

    // Get notification options based on user role
    const getNotifications = () => {
        const role = user?.role || 'patient';
        return notificationSettings[role as keyof typeof notificationSettings] || notificationSettings.patient;
    };

    // Load user data on mount
    useEffect(() => {
        if (profile) {
            const profileData = profile as any;
            const userName = profileData.fname
                ? `${profileData.fname} ${profileData.lname || ''}`.trim()
                : profileData.name || '';
            setName(userName);
        }
        if (user?.email) {
            setEmail(user.email);
        }

        // Initialize notification states
        const notifications = getNotifications();
        const initialStates: Record<string, boolean> = {};
        notifications.forEach(n => {
            initialStates[n.id] = true; // Default to enabled
        });
        setNotifStates(initialStates);
    }, [user, profile]);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success('Profile settings saved');
        setIsSaving(false);
    };

    const handleNotificationToggle = (id: string, label: string, value: boolean) => {
        setNotifStates(prev => ({ ...prev, [id]: value }));
        toast.success(`${value ? 'Enabled' : 'Disabled'} ${label.toLowerCase()}`);
    };

    const notifications = getNotifications();

    return (
        <>
            <div className="max-w-3xl mx-auto space-y-8 pb-12">
                <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

                {/* Account Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <User className="w-5 h-5 text-primary" />
                        <h2>Profile Information</h2>
                    </div>
                    <Card className="p-6 rounded-2xl shadow-sm border-border">
                        <div className="grid gap-5">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right text-muted-foreground">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your name"
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right text-muted-foreground">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="col-span-3"
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button className="gap-2" onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* Notifications Section - Role-specific */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2>Notifications</h2>
                    </div>
                    <Card className="p-6 rounded-2xl shadow-sm border-border">
                        <div className="space-y-4">
                            {notifications.map((notif) => (
                                <div key={notif.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                    <div>
                                        <h3 className="font-medium text-foreground">{notif.label}</h3>
                                        <p className="text-sm text-muted-foreground">{notif.description}</p>
                                    </div>
                                    <Switch
                                        checked={notifStates[notif.id] ?? true}
                                        onCheckedChange={(checked) => handleNotificationToggle(notif.id, notif.label, checked)}
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                {/* Security Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <Shield className="w-5 h-5 text-primary" />
                        <h2>Security</h2>
                    </div>
                    <Card className="p-6 rounded-2xl shadow-sm border-border">
                        <div className="space-y-4">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-12"
                                onClick={() => setIsPasswordDialogOpen(true)}
                            >
                                Change Password
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start rounded-xl h-12"
                                onClick={() => toast.info('Two-Factor Authentication coming soon')}
                            >
                                Two-Factor Authentication
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start rounded-xl h-12"
                                onClick={() => toast.info('Device management coming soon')}
                            >
                                Manage Connected Devices
                            </Button>
                        </div>
                    </Card>
                </section>
            </div>

            <ChangePasswordDialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
            />
        </>
    );
}
