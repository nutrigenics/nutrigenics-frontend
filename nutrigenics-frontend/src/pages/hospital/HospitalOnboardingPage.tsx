import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Mail, Phone, MapPin, Globe, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HospitalOnboardingPage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto mb-16">
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block p-1 px-3 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100"
          >
            Institution Registration
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
          >
            Register Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Hospital</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-xl mx-auto"
          >
            Join the network to manage practitioners, patients, and access advanced analytics.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-8 md:p-10 rounded-[2.5rem] border-gray-100 shadow-xl shadow-gray-900/5">
            <form className="space-y-8">
              {/* Organization Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">1</div>
                  Organization Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="hospitalName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital Name</Label>
                    <div className="relative">
                      <Input id="hospitalName" placeholder="St. Mary's General Hospital" className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10" />
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Institution Type</Label>
                    <div className="relative">
                      <Select>
                        <SelectTrigger className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Hospital</SelectItem>
                          <SelectItem value="specialized">Specialized Clinic</SelectItem>
                          <SelectItem value="teaching">Teaching Hospital</SelectItem>
                          <SelectItem value="research">Research Institute</SelectItem>
                        </SelectContent>
                      </Select>
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Website</Label>
                    <div className="relative">
                      <Input id="website" placeholder="www.hospital.org" className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10" />
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">2</div>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</Label>
                    <div className="relative">
                      <Input id="address" placeholder="123 Medical Center Dr" className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10" />
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Email</Label>
                    <div className="relative">
                      <Input id="adminEmail" type="email" placeholder="admin@hospital.org" className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10" />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Main Phone</Label>
                    <div className="relative">
                      <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-10 h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-logo/10" />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              {/* Verification */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">3</div>
                  Validation
                </h3>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">Upload Accreditation Documents</h4>
                  <p className="text-sm text-gray-500">License, registration proof, etc. (Max 10MB)</p>
                </div>
              </div>

              <Button className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-xl shadow-gray-900/10 text-lg">
                Submit Registration <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
