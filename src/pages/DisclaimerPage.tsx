import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  AlertTriangle,
  HeartPulse,
  PhoneCall,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  FileText,
  Mail,
} from 'lucide-react';

export default function DisclaimerPage() {
  const lastUpdated = "October 31, 2026";

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="w-full mb-12 p-8 md:p-12 bg-white rounded-[2.5rem] relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-gray-100 text-center">
        <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-orange-50 text-orange-600 rounded-2xl mb-6 shadow-sm ring-8 ring-orange-50/50"
          >
            <Stethoscope className="w-10 h-10" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight"
          >
            Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Disclaimer</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl leading-relaxed"
          >
            Important health advisory, physical harm prevention, and clinical safety disclosures provided in accordance with Apple App Store Review Guideline 1.4.1.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2 mt-6 px-4 py-1.5 bg-gray-50 border border-gray-200/60 rounded-full"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Last Updated: {lastUpdated} · Apple Guideline 1.4.1 Compliant
            </span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 px-4">
        {/* Sticky Sidebar Highlights */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm sticky top-24 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Clinical Safety Core</h3>
              <p className="text-xs text-gray-500">Essential rules for patient health safety.</p>
            </div>

            <ul className="space-y-3.5">
              {[
                { label: "Educational Nutrition Only", desc: "No diagnostic or prescription services" },
                { label: "Physician Consultation", desc: "Mandatory doctor guidance before dietary shifts" },
                { label: "Emergency Protocols", desc: "Call 911 / 998 / 112 for acute emergencies" },
                { label: "Algorithmic Approximations", desc: "Nutrient estimations require clinical review" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{item.label}</span>
                    <span className="text-[11px] text-gray-500 leading-tight block">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-gray-100">
              <div className="p-3.5 bg-red-50/60 border border-red-200/60 rounded-xl">
                <div className="flex items-center gap-2 text-red-800 font-semibold text-xs mb-1">
                  <PhoneCall className="w-4 h-4 text-red-600" />
                  Emergency Hotlines
                </div>
                <p className="text-[11px] text-red-800/90 leading-relaxed font-medium">
                  UAE: 998 / 999 · USA: 911 · EU/UK: 112 · India: 112
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href="/privacy"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                View Privacy Policy
              </a>
              <a
                href="/terms"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <div className="lg:col-span-2">
          <div className="w-full rounded-[2.5rem] bg-white border border-gray-100 shadow-sm p-8 md:p-10 space-y-10 text-gray-600">

            {/* Section 1 */}
            <section className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-600 text-white">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">1. Not a Substitute for Professional Medical Advice</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Nutrigenics Care provides precision nutritional tracking, meal intelligence, dietary analytics, and wellness information for <strong>educational and informational purposes only</strong>. The Service, including its mobile application, algorithms, chatbot, and educational content:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                <li>Does <strong>not</strong> constitute medical advice, medical diagnosis, clinical treatment plans, or formal prescriptions.</li>
                <li>Is not intended to diagnose, treat, cure, or prevent any chronic disease or acute medical condition.</li>
                <li>Does not establish a doctor-patient relationship between Nutrigenics and you.</li>
                <li>Should never be used to replace, override, or delay professional medical evaluation or prescribed therapeutic protocols.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section className="space-y-4 p-6 bg-teal-50/50 rounded-2xl border border-teal-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-600 text-white">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">2. Mandatory Healthcare Provider Consultation</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Always seek the guidance and supervision of your personal physician, licensed registered dietitian, endocrinologist, or qualified healthcare professional before:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                <li>Beginning any new dietary plan, caloric deficit, intermittent fasting protocol, or elimination diet.</li>
                <li>Introducing nutritional supplements, ergogenic aids, or drastic electrolyte alterations.</li>
                <li>Making dietary changes if you have pre-existing clinical conditions, including Type 1 or Type 2 Diabetes, hypertension, cardiovascular disease, chronic kidney disease (CKD), gout, eating disorders, or metabolic syndromes.</li>
                <li>Making dietary changes if you are pregnant, planning to become pregnant, lactating, or undergoing active clinical medical treatments (e.g. chemotherapy or dialysis).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-4 p-6 bg-red-50/60 rounded-2xl border border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-600 text-white">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">3. Acute Emergency Situations</h2>
              </div>
              <p className="text-sm text-red-950 font-semibold leading-relaxed">
                NUTRIGENICS CARE IS NOT AN EMERGENCY RESPONSE SYSTEM AND CANNOT PROVIDE EMERGENCY MEDICAL INTERVENTION.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed">
                If you experience sudden severe symptoms, severe chest pain, shortness of breath, acute hypoglycemia, severe allergic reactions (anaphylaxis), dizziness, or any life-threatening condition:
              </p>
              <div className="p-3.5 bg-white rounded-xl border border-red-200 text-xs font-semibold text-red-700">
                Immediately call local emergency services (911 in the USA, 998 / 999 in the UAE, 112 in Europe, 112 in India) or visit the nearest hospital emergency department. Do not rely on Nutrigenics communications or chatbot responses in an emergency.
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-4 p-6 bg-purple-50/50 rounded-2xl border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">4. AI & Automated Dietary Approximations</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Our mobile and web applications incorporate computer vision meal recognition, automated nutrient estimation, and conversational AI guidance (&quot;Ask Nutrigenics&quot;):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                <li><strong>Statistical Approximations:</strong> Macronutrient, caloric, and micronutrient calculations are derived from verified clinical food composition databases (such as USDA FoodData Central and regional nutritional registries). However, individual portions, oil absorption, and culinary variations mean calculations are mathematical estimations.</li>
                <li><strong>AI Assistant Limitations:</strong> The conversational AI is powered by large language models configured for clinical nutrition context. It is an educational tool and may occasionally generate inaccurate or incomplete guidance. You should independently verify AI recommendations with your registered dietitian.</li>
              </ul>
            </section>

            {/* Contact Section */}
            <section className="space-y-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 text-gray-800">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">5. Clinical Governance Inquiries</h2>
              </div>
              <p className="leading-relaxed text-sm">
                For clinical compliance inquiries, registered dietitian credentialing, or safety questions:
              </p>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                <p><strong>Nutrigenics Care — Clinical Governance & Safety Board</strong></p>
                <p>Clinical Safety Email: <a href="mailto:safety@nutrigenics.care" className="text-teal-600 font-medium hover:underline">safety@nutrigenics.care</a></p>
                <p>Compliance Email: <a href="mailto:compliance@nutrigenics.care" className="text-teal-600 font-medium hover:underline">compliance@nutrigenics.care</a></p>
                <p>Website: <a href="https://nutrigenics.care" className="text-teal-600 font-medium hover:underline">https://nutrigenics.care</a></p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
