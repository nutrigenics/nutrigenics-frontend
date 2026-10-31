import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import {
  FileText,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Trash2,
  Stethoscope,
  Scale,
  CheckCircle,
  Mail,
  Zap,
} from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = "October 31, 2026";

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="w-full mb-12 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-teal-50 text-teal-600 rounded-2xl mb-6 shadow-sm ring-8 ring-teal-50/50"
          >
            <FileText className="w-10 h-10" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Service</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl leading-relaxed"
          >
            Please review these terms and conditions carefully before using Nutrigenics Care on iOS or the web. These terms govern your rights, medical safety boundaries, account management, and clinical usage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mt-6 px-4 py-1.5 bg-gray-50 border border-gray-200/60 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Last Updated: {lastUpdated} · Clinical Version 2.4
            </span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 px-4">
        {/* Sticky Sidebar Highlights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-24 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Key Provisions</h3>
              <p className="text-xs text-gray-500">Summary of key legal and clinical conditions.</p>
            </div>

            <ul className="space-y-3.5">
              {[
                { label: "Educational & Nutritional Scope", desc: "Not a substitute for professional medical advice" },
                { label: "Apple Guideline 1.4.1 Compliant", desc: "Mandatory doctor consultation advisory" },
                { label: "Patient-Provider Communication", desc: "Secure channel with registered dietitians" },
                { label: "Full Account Deletion Rights", desc: "Direct in-app account & data purge" },
                { label: "Intellectual Property", desc: "Proprietary nutrition analytics and recipes" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{item.label}</span>
                    <span className="text-[11px] text-gray-500 leading-tight block">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-gray-100">
              <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Clinical Emergency Warning
                </div>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  Nutrigenics is not an emergency service. In an acute medical emergency, immediately contact 911 / 998 / 112.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#medical-disclaimer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                Read Medical Advisory
              </a>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <div className="lg:col-span-2">
          <div className="w-full rounded-[2.5rem] bg-white border border-gray-100 shadow-sm p-8 md:p-10 space-y-10 text-gray-600">

            {/* 1. Acceptance of Terms */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Agreement to Terms & Eligibility</h2>
              </div>
              <p className="leading-relaxed">
                These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;, or &quot;your&quot;) and Nutrigenics Care (&quot;Nutrigenics&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) governing your access to and use of our iOS application, web platform (<a href="https://nutrigenics.care" className="text-teal-600 font-medium hover:underline">nutrigenics.care</a>), and associated digital health technologies (collectively, the &quot;Service&quot;).
              </p>
              <p className="leading-relaxed">
                By creating an account, downloading our iOS application from the Apple App Store, or accessing any part of the Service, you signify your acceptance of these Terms and our <a href="/privacy" className="text-teal-600 font-medium hover:underline">Privacy Policy</a>. If you do not agree to these Terms, you must not access or use the Service.
              </p>
              <p className="leading-relaxed text-sm">
                <strong>Eligibility:</strong> You must be at least 18 years of age (or the age of legal majority in your jurisdiction) to establish an independent account. Individuals between 13 and 17 may only use the Service with verified consent and supervision of a parent, legal guardian, or treating pediatrician.
              </p>
            </section>

            {/* 2. Medical & Clinical Disclaimer (Apple Guideline 1.4.1) */}
            <section id="medical-disclaimer" className="space-y-4 p-6 bg-amber-50/50 rounded-2xl border border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-600 text-white">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">2. Medical & Clinical Advisory (Apple App Store Guideline 1.4.1)</h2>
              </div>

              <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1 text-amber-900">A. Informational and Educational Purposes Only</h4>
                  <p className="text-xs text-gray-600">
                    Nutrigenics Care provides precision nutritional logging, dietary intelligence, meal recommendations, and metabolic trend tracking for wellness and educational purposes only. The Service, its algorithms, and automated AI chat responses <strong>do not constitute medical advice, medical diagnosis, clinical prescriptions, or formal medical care</strong>.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1 text-amber-900">B. Mandatory Healthcare Provider Consultation</h4>
                  <p className="text-xs text-gray-600">
                    Always seek the advice of your physician, licensed clinical dietitian, or qualified healthcare professional before beginning any new diet, caloric deficit, fasting protocol, supplement regimen, or lifestyle change, especially if you have pre-existing medical conditions (including but not limited to Type 1 or Type 2 Diabetes, cardiovascular conditions, renal disorders, gastrointestinal conditions) or are pregnant or lactating.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1 text-amber-900">C. Emergency Medical Situations</h4>
                  <p className="text-xs text-gray-600">
                    Nutrigenics is not an emergency response system. If you believe you are experiencing a medical emergency, severe acute symptoms, or life-threatening adverse allergic reactions, immediately call local emergency services (e.g. 911 in the United States, 998 in the UAE, 112 in the European Union) or proceed to the nearest emergency room.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-amber-200">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-1 text-amber-900">D. AI & Automated Nutrient Calculations</h4>
                  <p className="text-xs text-gray-600">
                    Nutritional estimations, computer vision meal recognitions, and macronutrient breakdowns are statistical approximations based on verified nutritional databases. While engineered for high precision, estimations may vary based on portion sizing, preparation methods, and ingredients.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. User Accounts & Security */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. User Accounts & Security</h2>
              </div>
              <p className="leading-relaxed">
                When you register, you agree to provide accurate, current, and complete health and identity information. You are solely responsible for maintaining the confidentiality of your account credentials, passwords, and two-factor authentication tokens. You must notify us immediately at <a href="mailto:security@nutrigenics.care" className="text-teal-600 font-medium hover:underline">security@nutrigenics.care</a> if you suspect any unauthorized access to your account.
              </p>
            </section>

            {/* 4. Patient-Provider Relationship */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Zap className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">4. Patient-Provider Technology Platform</h2>
              </div>
              <p className="leading-relaxed">
                Nutrigenics acts as a technology intermediary enabling communication, meal record sharing, and adherence tracking between patients and their chosen registered dietitians or clinical partner hospitals.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
                <li>Nutrigenics does not practice medicine or directly employ treating clinicians.</li>
                <li>Your licensed dietitian or clinical care team remains solely responsible for clinical decisions and medical diagnoses.</li>
                <li>You may disconnect from an assigned dietitian or request care team re-assignment at any time directly through the app.</li>
              </ul>
            </section>

            {/* 5. Account Deletion Rights (Apple Guideline 5.1.1(v)) */}
            <section className="space-y-3 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-900 text-white">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">5. Right to Immediate Account Deletion (Apple Guideline 5.1.1(v))</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                In compliance with Apple App Store rules, you have the absolute right to delete your account and all associated health records directly from within our iOS app at any time:
              </p>
              <p className="text-xs font-semibold text-gray-900">
                Go to Profile Hub &rarr; Settings & Security &rarr; Account &rarr; Delete Account.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Account deletion is immediate and irrevocable, permanently scrubbing your profile, meal logs, biometric trends, and care messages.
              </p>
            </section>

            {/* 6. Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">6. Intellectual Property & License</h2>
              <p className="leading-relaxed text-sm">
                The Service, including its proprietary codebase, visual designs, algorithms, recipe repository, trademarks, and logos, is the exclusive intellectual property of Nutrigenics Care. We grant you a limited, non-exclusive, non-transferable, revocable license to use the app for personal, non-commercial health management.
              </p>
            </section>

            {/* 7. User Content & Data Ownership */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">7. Your Content & Dietary Data</h2>
              <p className="leading-relaxed text-sm">
                You retain complete ownership of all meal photos, personal biometrics, and dietary logs you submit to the Service. By uploading content, you grant Nutrigenics a restricted license solely to host, process, and analyze your data to provide you with the Service and to facilitate collaboration with your designated care team.
              </p>
            </section>

            {/* 8. Prohibited Activities */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">8. Prohibited Conduct</h2>
              </div>
              <p className="leading-relaxed text-sm">
                You agree not to: (a) reverse engineer, decompile, or extract the source code of the app; (b) scrape or harvest nutritional data or recipe catalogs using automated bots; (c) attempt unauthorized access to other patient PHI or HIPAA-regulated databases; (d) use the Service to transmit harmful code, spam, or defamatory content.
              </p>
            </section>

            {/* 9. Disclaimer of Warranties & Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">9. Disclaimers of Warranties & Limitation of Liability</h2>
              <p className="leading-relaxed text-xs text-gray-600 uppercase tracking-wide">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, NUTRIGENICS DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="leading-relaxed text-xs text-gray-600">
                IN NO EVENT SHALL NUTRIGENICS, ITS DIRECTORS, EMPLOYEES, OR CLINICAL ADVISORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, INCLUDING RELIANCE ON NUTRITIONAL ESTIMATES OR ADVICE.
              </p>
            </section>

            {/* 10. Governing Law & Dispute Resolution */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">10. Governing Law & Dispute Resolution</h2>
              <p className="leading-relaxed text-sm">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any legal controversy or claim arising out of these Terms shall first be addressed through good-faith informal negotiation.
              </p>
            </section>

            {/* 11. Contact Us */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">11. Legal Inquiries & Contact</h2>
              </div>
              <p className="leading-relaxed text-sm">
                If you have questions or require clarification regarding these Terms of Service, please contact our legal department:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                <p><strong>Nutrigenics Care — Legal & Regulatory Affairs</strong></p>
                <p>Legal Inquiries: <a href="mailto:legal@nutrigenics.care" className="text-teal-600 font-medium hover:underline">legal@nutrigenics.care</a></p>
                <p>Support: <a href="mailto:support@nutrigenics.care" className="text-teal-600 font-medium hover:underline">support@nutrigenics.care</a></p>
                <p>Website: <a href="https://nutrigenics.care" className="text-teal-600 font-medium hover:underline">https://nutrigenics.care</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
