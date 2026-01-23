import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto mb-16 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-6 text-blue-600"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-gray-900 mb-6"
          >
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Touch</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto"
          >
            Have questions or need support? We're here to help you on your health journey.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="bg-gray-900 text-white p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-xl">
              <div className="relative z-10 space-y-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Contact Information</h3>
                  <p className="text-gray-400">Reach out to us through any of these channels.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <Mail className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-lg font-medium">support@nutrigenics.care</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <Phone className="w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-lg font-medium">+1 (888) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                      <MapPin className="w-6 h-6 text-rose-300" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Office</p>
                      <p className="text-lg font-medium">100 Innovation Dr, Suite 500<br />San Francisco, CA 94105</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative Blobs */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-900/5"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">First Name</Label>
                  <Input id="firstName" placeholder="Jane" className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</Label>
                <Input id="email" type="email" placeholder="jane@example.com" className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Message</Label>
                <textarea
                  id="message"
                  className="w-full min-h-[150px] p-4 bg-gray-50 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  placeholder="How can we help you?"
                />
              </div>

              <Button className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 shadow-lg text-lg">
                Send Message <Send className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
