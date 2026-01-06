// MainLayout removed
// import { MainLayout } from '@/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Bell, Shield, User, Save } from 'lucide-react';
import { useState } from 'react';
import { ChangePasswordDialog } from '@/components/settings/ChangePasswordDialog';

export default function SettingsPage() {
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

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
                                <Input id="name" placeholder="Your name" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right text-muted-foreground">
                                    Email
                                </Label>
                                <Input id="email" type="email" placeholder="your@email.com" className="col-span-3" />
                            </div>
                        </div>
                        <div className="flex justify-end mt-6">
                            <Button className="gap-2">
                                <Save className="w-4 h-4" /> Save Changes
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* Notifications Section */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xl font-semibold text-foreground">
                        <Bell className="w-5 h-5 text-primary" />
                        <h2>Notifications</h2>
                    </div>
                    <Card className="p-6 rounded-2xl shadow-sm border-border">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                <div>
                                    <h3 className="font-medium text-foreground">Email Notifications</h3>
                                    <p className="text-sm text-muted-foreground">Receive daily summaries and updates</p>
                                </div>
                                <Button variant="outline" size="sm">Enabled</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                <div>
                                    <h3 className="font-medium text-foreground">Meal Reminders</h3>
                                    <p className="text-sm text-muted-foreground">Get notified when it's time to eat</p>
                                </div>
                                <Button variant="outline" size="sm">Enabled</Button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                                <div>
                                    <h3 className="font-medium text-foreground">Dietitian Messages</h3>
                                    <p className="text-sm text-muted-foreground">Alerts when your dietitian sends a message</p>
                                </div>
                                <Button variant="outline" size="sm">Enabled</Button>
                            </div>
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
                            <Button variant="outline" className="w-full justify-start rounded-xl h-12">
                                Two-Factor Authentication
                            </Button>
                            <Button variant="outline" className="w-full justify-start rounded-xl h-12">
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

