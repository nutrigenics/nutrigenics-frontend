import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, CheckCircle } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="w-full mb-12 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gray-50 rounded-2xl mb-6 shadow-sm"
          >
            <Shield className="w-10 h-10 text-gray-900" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">Policy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-xl"
          >
            We are committed to protecting your personal data and ensuring your privacy.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4"
          >
            Last Updated: October 24, 2023
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 px-4">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Highlights</h3>
            <ul className="space-y-3">
              {[
                "Data Encryption",
                "HIPAA Compliance",
                "User Control",
                "Transparent Usage"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="h-[800px] w-full rounded-[2.5rem] bg-white border border-gray-100 shadow-sm p-8 md:p-10 overflow-y-auto">
            <div className="prose prose-gray max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-gray-400" />
                  1. Introduction
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Welcome to Nutrigenics. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-gray-400" />
                  2. Data We Collect
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li><strong className="text-gray-900">Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                  <li><strong className="text-gray-900">Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                  <li><strong className="text-gray-900">Health Data:</strong> includes genetic information, dietary preferences, and health metrics you provide.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-gray-400" />
                  3. Data Security
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Your Legal Rights</h2>
                <p className="text-gray-600 leading-relaxed">
                  Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
