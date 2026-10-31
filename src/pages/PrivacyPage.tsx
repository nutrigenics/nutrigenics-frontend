import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  FileText,
  CheckCircle,
  Trash2,
  Download,
  AlertCircle,
  Database,
  EyeOff,
  UserCheck,
  Mail,
  HeartPulse,
} from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="w-10 h-10" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Policy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl leading-relaxed"
          >
            Nutrigenics Care is dedicated to protecting your personal health information. This policy outlines our clinical data practices, HIPAA compliance, encryption standards, and user rights in full accordance with Apple App Store Review Guidelines.
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Privacy Highlights</h3>
              <p className="text-xs text-gray-500">Summary of our core commitments to patient privacy.</p>
            </div>

            <ul className="space-y-3.5">
              {[
                { label: "End-to-End Encryption", desc: "AES-256 at rest & TLS 1.3 in transit" },
                { label: "Never Sold or Monetized", desc: "Zero data brokers or advertiser sharing" },
                { label: "HIPAA & DOH Aligned", desc: "Strict Protected Health Information safeguards" },
                { label: "Instant Account Deletion", desc: "Self-service permanent purge in-app" },
                { label: "User Data Ownership", desc: "Export your complete medical & meal logs" },
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
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  Apple Guideline 5.1 Certified
                </div>
                <p className="text-[11px] text-emerald-700/90 leading-relaxed">
                  Compliant with Apple App Store Review Guideline 5.1 (Privacy & Data Retention) and 1.4.1 (Medical Disclaimers).
                </p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#account-deletion"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                How to Delete Your Account
              </a>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <div className="lg:col-span-2">
          <div className="w-full rounded-[2.5rem] bg-white border border-gray-100 shadow-sm p-8 md:p-10 space-y-10 text-gray-600">

            {/* 1. Introduction & Scope */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">1. Introduction & Overview</h2>
              </div>
              <p className="leading-relaxed">
                Nutrigenics Care (&quot;Nutrigenics&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides precision nutritional tracking, biometric analytics, meal logging, and clinical collaboration between individuals and healthcare providers through our iOS application and web platform (accessible at <a href="https://nutrigenics.care" className="text-teal-600 font-medium hover:underline">nutrigenics.care</a>).
              </p>
              <p className="leading-relaxed">
                We believe your health data is deeply personal. This Privacy Policy details how we collect, process, safeguard, and disclose information when you utilize our services. It also informs you of your legal rights regarding Protected Health Information (PHI) under the Health Insurance Portability and Accountability Act (HIPAA), the UAE Department of Health (DOH) Standards for Health Information and Cyber Security, and international privacy regulations (including GDPR and CCPA/CPRA).
              </p>
            </section>

            {/* 2. Data We Collect */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">2. Categories of Data We Collect</h2>
              </div>
              <p className="leading-relaxed">
                To provide tailored nutrition planning and clinical care management, we collect the following categories of information:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">A. Account & Identity Data</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Full name, email address, cryptographically hashed passwords, role selection (Patient, Registered Dietitian, Clinical Facility Admin), profile photograph, and contact phone number.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">B. Clinical Health & Dietary Data (Protected Health Information - PHI)</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Biometric measurements (height, weight, body mass index, age, biological sex), dietary preferences, food allergies and intolerances, medical diagnoses you voluntarily disclose (e.g. Type 2 Diabetes, hypertension, renal considerations), daily caloric and macronutrient targets, logged meals, meal photos, hydration logs, and daily symptom notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">C. Care Team Communication Data</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Messages, feedback notes, and dietary adjustments exchanged between patients and their assigned clinical dietitians or hospital care coordinators.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">D. Technical & Operational Diagnostics</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Device model, iOS version, application version, crash telemetry, and network status indicators. We <strong>do not</strong> track or request your device Advertising Identifier (IDFA).
                  </p>
                </div>
              </div>
            </section>

            {/* 3. How We Use Data */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">3. Purpose and Legal Basis for Processing</h2>
              </div>
              <p className="leading-relaxed">
                We process your data strictly for legitimate clinical, educational, and service delivery purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                <li><strong>Precision Dietary Analytics:</strong> Generating tailored macronutrient distributions, caloric burn estimates, and personalized recipe recommendations.</li>
                <li><strong>Care Team Coordination:</strong> Enabling your licensed clinical dietitian to monitor adherence, evaluate meal logs, and prescribe dietary plans.</li>
                <li><strong>AI Assistant Operations:</strong> Providing conversational dietary intelligence and nutritional explanations via our AI chatbot. Health inquiries are processed ephemeral and not correlated with public models.</li>
                <li><strong>Security & HIPAA Audit Trails:</strong> Maintaining immutable access logs for patient records to ensure clinical confidentiality.</li>
              </ul>
            </section>

            {/* 4. Strict Prohibition on Sale of Data */}
            <section className="space-y-3 p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white">
                  <EyeOff className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-emerald-950">4. Our Strict Policy: We Never Sell Your Data</h2>
              </div>
              <p className="text-sm text-emerald-900/90 leading-relaxed">
                Nutrigenics has never sold, rented, monetized, or leased personal or health data, and <strong>will never do so</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-emerald-900/80 leading-relaxed">
                <li>We do not share your health data with advertising networks, third-party trackers, or data brokers.</li>
                <li>Your Protected Health Information is never used for commercial marketing.</li>
                <li>Your meal logs and clinical notes are never used to train public commercial AI models without explicit, opt-in clinical research consent.</li>
              </ul>
            </section>

            {/* 5. Data Security & Storage */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Data Security & Storage Standards</h2>
              </div>
              <p className="leading-relaxed">
                We employ defense-in-depth architectural safeguards to protect your Protected Health Information (PHI):
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                <li><strong>Cryptographic Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at rest using military-grade AES-256 encryption.</li>
                <li><strong>Role-Based Access Control (RBAC):</strong> Only you and your authorized, connected dietitian or clinical administrator can access your dietary profiles.</li>
                <li><strong>Audit Trails:</strong> Every access, export, or edit of patient health records generates an audit log available for review within the application.</li>
              </ul>
            </section>

            {/* 6. Account Deletion & Data Retention (Apple Guideline 5.1.1(v)) */}
            <section id="account-deletion" className="space-y-4 p-6 bg-red-50/50 rounded-2xl border border-red-200/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">6. Account Deletion & Data Retention (Apple Guideline 5.1.1(v))</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                In strict accordance with Apple App Store Review Guideline 5.1.1(v), Nutrigenics provides direct, automated self-service account and data deletion mechanisms. You do not need to call or submit multi-step support tickets.
              </p>

              <div className="bg-white p-4 rounded-xl border border-red-100 space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">How to Delete Your Account and Health Data:</h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                  <li><strong>In the iOS App:</strong> Open the app, navigate to <strong>Profile Hub</strong> &rarr; tap <strong>Settings & Security</strong> &rarr; locate the <strong>Account</strong> section &rarr; tap <strong>Delete Account</strong>. Confirm your password.</li>
                  <li><strong>On the Web Platform:</strong> Log in to <a href="https://nutrigenics.care/settings" className="text-teal-600 hover:underline font-medium">nutrigenics.care/settings</a>, scroll to Account Actions, and click <strong>Delete Account</strong>.</li>
                  <li><strong>By Written Request:</strong> Send an email from your registered email address to <a href="mailto:privacy@nutrigenics.care" className="text-teal-600 font-medium hover:underline">privacy@nutrigenics.care</a> with the subject line <em>&quot;Request Account Deletion&quot;</em>. Requests are processed within 48 hours.</li>
                </ol>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>What Happens Upon Deletion:</strong> All personal identifiers, authentication tokens, meal photos, dietary logs, and chat records are immediately severed and permanently expunged from our production databases. Clinical audit records mandated by statutory healthcare compliance laws are archived in encrypted cold storage and destroyed upon expiration of statutory retention periods.
              </p>
            </section>

            {/* 7. User Rights (GDPR & CCPA) */}
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Download className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">7. Your Legal Privacy Rights</h2>
              </div>
              <p className="leading-relaxed">
                Regardless of your geographic location, Nutrigenics grants all users comprehensive control over their health data:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                <li><strong>Right to Data Portability:</strong> You can export your full profile, meal logs, and dietary history in standard JSON/CSV format at any time directly via the <em>Download My Data</em> button in Settings.</li>
                <li><strong>Right to Rectification:</strong> You can update incorrect biometrics, allergens, or personal details at any time in Edit Profile.</li>
                <li><strong>Right to Withdraw Consent:</strong> You may revoke your digital health consent at any time, terminating future automated health processing.</li>
                <li><strong>Right to Non-Discrimination:</strong> We never discriminate against any user who exercises their privacy rights.</li>
              </ul>
            </section>

            {/* 8. Medical & Educational Scope */}
            <section className="space-y-3 p-5 bg-amber-50/60 rounded-2xl border border-amber-200/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-600 text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-amber-950">8. Clinical Safety & Medical Scope Notice</h2>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                In compliance with Apple Guideline 1.4.1 (Physical Harm & Medical Apps), Nutrigenics provides nutritional tracking, dietary intelligence, and educational wellness analytics. It is not a diagnostic medical device and does not dispense prescription pharmaceuticals. Always consult a physician or registered dietitian before beginning clinical dietary modifications. In an acute emergency, call 911 / 998 / 112 immediately.
              </p>
              <p className="text-xs text-amber-900/80">
                Read our full <a href="/disclaimer" className="font-bold underline hover:text-amber-950">Medical & Clinical Safety Advisory</a> for complete clinical disclosures.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">9. Children&apos;s Privacy</h2>
              <p className="leading-relaxed text-sm">
                Our services are intended for individuals who are at least 18 years of age (or at least 13 years of age with verified parental or legal guardian consent). We do not knowingly collect personal or health information from children under 13. If you become aware that a child has provided us with health information without parental consent, please contact us at <a href="mailto:privacy@nutrigenics.care" className="text-teal-600 font-medium hover:underline">privacy@nutrigenics.care</a> and we will promptly purge the data.
              </p>
            </section>

            {/* 10. Contact Us */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">10. Contact Our Privacy & Compliance Team</h2>
              </div>
              <p className="leading-relaxed text-sm">
                If you have questions, regulatory inquiries, or concerns regarding this Privacy Policy or our clinical data protection standards, please reach out to our Data Protection Officer:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                <p><strong>Nutrigenics Care — Privacy & Data Protection Office</strong></p>
                <p>Email: <a href="mailto:privacy@nutrigenics.care" className="text-teal-600 font-medium hover:underline">privacy@nutrigenics.care</a></p>
                <p>Clinical Compliance: <a href="mailto:compliance@nutrigenics.care" className="text-teal-600 font-medium hover:underline">compliance@nutrigenics.care</a></p>
                <p>Official Website: <a href="https://nutrigenics.care" className="text-teal-600 font-medium hover:underline">https://nutrigenics.care</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
