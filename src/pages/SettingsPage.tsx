import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Bell,
    Shield,
    Palette,
    LogOut,
    ChevronRight,
    Monitor,
    Key,
    Fingerprint,
    Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

// Tab Configuration used to render sidebar
const TABS = [
    { id: 'account', label: 'Account', icon: User, description: 'Manage your personal details' },
    { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Customize the interface' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure alerts & messages' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Password & authentication' },
];

const notificationPreview = {
    email_updates: true,
    push_reminders: true,
    dietitian_messages: true,
    marketing_emails: false,
};

export default function SettingsPage() {
    const navigate = useNavigate();
    const { profile, logout } = useAuth();
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('account');
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDeleteAccount = async (password?: string) => {
        try {
            await authService.deleteAccount(password);
            toast.success('Account deleted successfully');
            await logout();
            navigate('/login');
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to delete account';
            toast.error(errorMsg);
            throw error;
        }
    };

    // Helper to render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Profile Summary Card */}
                        <Card className="border-border/60 shadow-sm overflow-hidden">
                            <CardContent className="relative px-8 py-8">
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="h-20 w-20 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/5">
                                        <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                                            {((profile as any)?.fname?.[0] || (profile as any)?.name?.[0] || 'U')}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {(profile as any)?.fname || (profile as any)?.name || 'User'} {(profile as any)?.lname || ''}
                                        </h3>
                                        <p className="text-sm text-gray-500">{profile?.email}</p>
                                    </div>
                                    <Button variant="outline" className="rounded-xl" onClick={() => navigate('/profile')}>
                                        Edit Profile
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Data & Privacy */}
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Data & Privacy</CardTitle>
                                <CardDescription>Manage your data collection settings</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                                    <div className="space-y-0.5">
                                        <h4 className="font-medium text-sm">Download My Data</h4>
                                        <p className="text-xs text-muted-foreground">Data export will be enabled once the testing workflow is finalized.</p>
                                    </div>
                                    <Button variant="outline" size="sm" disabled>
                                        <Download className="w-4 h-4 mr-2" />
                                        Coming Soon
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                                    <div className="space-y-0.5">
                                        <h4 className="font-medium text-sm text-red-700">Danger Zone</h4>
                                        <p className="text-xs text-red-600/80">Permanently delete your account and all data</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                                        Delete Account
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Theme Preferences</CardTitle>
                                <CardDescription>Customize how Nutrigenics looks on your device</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Light Mode */}
                                    <button
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                            theme === 'light' ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-gray-300 bg-white"
                                        )}
                                        onClick={() => toast.info("Light mode is currently the only available theme.")}
                                    >
                                        <div className="w-full aspect-video rounded-lg bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center mb-2">
                                            <div className="w-3/4 h-3/4 bg-white rounded shadow-sm p-2 flex gap-2">
                                                <div className="w-1/4 h-full bg-gray-50 rounded-sm"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="w-full h-8 bg-gray-50 rounded-sm"></div>
                                                    <div className="w-1/2 h-20 bg-blue-50 rounded-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-medium text-sm">Light</span>
                                    </button>

                                    {/* Dark Mode (Disabled styled) */}
                                    <button
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border bg-gray-50 opacity-60 cursor-not-allowed"
                                        title="Coming soon"
                                        disabled
                                    >
                                        <div className="w-full aspect-video rounded-lg bg-slate-900 border border-slate-700 shadow-sm flex items-center justify-center mb-2">
                                            <div className="w-3/4 h-3/4 bg-slate-800 rounded shadow-sm p-2 flex gap-2">
                                                <div className="w-1/4 h-full bg-slate-700 rounded-sm"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="w-full h-8 bg-slate-700 rounded-sm"></div>
                                                    <div className="w-1/2 h-20 bg-blue-900/30 rounded-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="font-medium text-sm">Dark (Coming Soon)</span>
                                    </button>

                                    {/* System */}
                                    <button
                                        className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border bg-gray-50 opacity-60 cursor-not-allowed"
                                        title="Coming soon"
                                        disabled
                                    >
                                        <div className="w-full aspect-video rounded-lg bg-gradient-to-r from-gray-100 to-slate-900 border border-gray-200 shadow-sm flex items-center justify-center mb-2 relative overflow-hidden">
                                            <div className="absolute inset-0 flex">
                                                <div className="w-1/2 h-full bg-white opacity-90"></div>
                                                <div className="w-1/2 h-full bg-slate-900 opacity-90"></div>
                                            </div>
                                        </div>
                                        <span className="font-medium text-sm">System</span>
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Email Notifications</CardTitle>
                                <CardDescription>Notification preferences will be customizable in a later release.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    <span>These controls are preview-only during testing. Core reminders and care alerts still work automatically.</span>
                                    <Badge variant="outline" className="border-amber-300 bg-white text-amber-700">Preview</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Weekly Summary</Label>
                                        <p className="text-sm text-muted-foreground">Receive a weekly report of your progress</p>
                                    </div>
                                    <Switch
                                        checked={notificationPreview.email_updates}
                                        disabled
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Marketing & Tips</Label>
                                        <p className="text-sm text-muted-foreground">Receive nutrition tips and feature updates</p>
                                    </div>
                                    <Switch
                                        checked={notificationPreview.marketing_emails}
                                        disabled
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Push Notifications</CardTitle>
                                <CardDescription>Manage real-time alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Daily Reminders</Label>
                                        <p className="text-sm text-muted-foreground">Reminders to log meals and water (Breakfast, Lunch, Dinner)</p>
                                    </div>
                                    <Switch
                                        checked={notificationPreview.push_reminders}
                                        disabled
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Dietitian Messages</Label>
                                        <p className="text-sm text-muted-foreground">Get notified when your dietitian messages you</p>
                                    </div>
                                    <Switch
                                        checked={notificationPreview.dietitian_messages}
                                        disabled
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Authentication</CardTitle>
                                <CardDescription>Manage your password and sign-in methods</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <Key className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="font-semibold text-gray-900">Password</h4>
                                            <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => setIsPasswordOpen(true)}>Change Password</Button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                            <Fingerprint className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                                                <Badge variant="outline" className="text-xs border-primary/20 bg-primary/10 text-primary">Recommended</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                        </div>
                                    </div>
                                    <Switch disabled />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle>Active Sessions</CardTitle>
                                <CardDescription>Session management will be available after the production security rollout.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-4">
                                        <Monitor className="w-8 h-8 text-gray-400" />
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">Session controls are not available yet</p>
                                            <p className="text-xs text-gray-500">You can still sign out immediately from the sidebar.</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-slate-200 text-slate-600">Coming Soon</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="container max-w-6xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and system settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
                {/* Sidebar Navigation */}
                <Card className="border-border/60 shadow-sm sticky top-24">
                    <CardContent className="p-3">
                        <nav className="space-y-1">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group",
                                        activeTab === tab.id
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <tab.icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            activeTab === tab.id ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        {tab.label}
                                    </div>
                                    {activeTab === tab.id && (
                                        <ChevronRight className="w-4 h-4 text-primary opacity-50" />
                                    )}
                                </button>
                            ))}
                            <Separator className="my-2" />
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </nav>
                    </CardContent>
                </Card>

                {/* Main Content Area */}
                <main className="min-h-[500px]">
                    {renderContent()}
                </main>
            </div>

            <ChangePasswordDialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen} />
            <DeleteAccountDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDeleteAccount}
                requirePassword={false}
            />
        </div>
    );
}
