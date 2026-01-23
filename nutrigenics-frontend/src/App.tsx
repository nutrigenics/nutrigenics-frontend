import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Toaster } from "@/components/ui/sonner";
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));
const OnboardingPage = lazy(() => import('@/pages/auth/OnboardingPage'));

// Home Page (role-based redirect)
const HomePage = lazy(() => import('@/pages/HomePage'));

// Patient Pages
const DashboardPage = lazy(() => import('@/pages/patient/DashboardPage'));
const MealPlanPage = lazy(() => import('@/pages/patient/MealPlanPage'));
const RecipeResultsPage = lazy(() => import('@/pages/patient/RecipeResultsPage'));
const RecipeDetailPage = lazy(() => import('@/pages/patient/RecipeDetailPage'));
const SearchRecipesPage = lazy(() => import('@/pages/patient/SearchRecipesPage'));
const RecipesPage = lazy(() => import('@/pages/patient/RecipesPage'));
const AnalyticsPage = lazy(() => import('@/pages/patient/AnalyticsPage'));
const AIChatPage = lazy(() => import('@/pages/patient/AIChatPage'));
const BookmarksPage = lazy(() => import('@/pages/patient/BookmarksPage'));
const MyDietitianPage = lazy(() => import('@/pages/patient/MyDietitianPage'));
const MyDietitianChatPage = lazy(() => import('@/pages/patient/MyDietitianChatPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/patient/ProfilePage'));

// Dietitian Pages
const DietitianDashboardPage = lazy(() => import('@/pages/dietitian/DietitianDashboardPage'));
const DietitianPatientsPage = lazy(() => import('@/pages/dietitian/DietitianPatientsPage'));
const DietitianChatsPage = lazy(() => import('@/pages/dietitian/DietitianChatsPage'));
const DietitianChatPage = lazy(() => import('@/pages/dietitian/DietitianChatPage'));
const DietitianProfilePage = lazy(() => import('@/pages/dietitian/DietitianProfilePage'));
const DietitianOnboardingPage = lazy(() => import('@/pages/dietitian/DietitianOnboardingPage'));
const DietitianPatientAnalyticsPage = lazy(() => import('@/pages/dietitian/DietitianPatientAnalyticsPage'));
const DietitianMealPlansPage = lazy(() => import('@/pages/dietitian/DietitianMealPlansPage'));

// Hospital Pages
const HospitalDashboardPage = lazy(() => import('@/pages/hospital/HospitalDashboardPage'));
const HospitalDietitiansPage = lazy(() => import('@/pages/hospital/HospitalDietitiansPage'));
const HospitalRequestsPage = lazy(() => import('@/pages/hospital/HospitalRequestsPage'));
const HospitalProfilePage = lazy(() => import('@/pages/hospital/HospitalProfilePage'));
const HospitalOnboardingPage = lazy(() => import('@/pages/hospital/HospitalOnboardingPage'));

// Other
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));



function App() {
  return (
    <AuthProvider>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <NotificationProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                <Route path="/dietitian/onboarding" element={<DietitianOnboardingPage />} />
                <Route path="/hospital/onboarding" element={<HospitalOnboardingPage />} />

                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Protected Routes (Patient) */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/plan" element={<MealPlanPage />} />
                    <Route path="/recipes" element={<RecipesPage />} />
                    <Route path="/recipes/results" element={<RecipeResultsPage />} />
                    <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                    <Route path="/search" element={<SearchRecipesPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/chat" element={<AIChatPage />} />
                    <Route path="/bookmarks" element={<BookmarksPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/my-dietitian" element={<MyDietitianPage />} />
                    <Route path="/my-dietitian/chat" element={<MyDietitianChatPage />} />
                  </Route>
                </Route>

                {/* Protected Routes (Dietitian) */}
                <Route element={<ProtectedRoute role="dietitian" />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dietitian/dashboard" element={<DietitianDashboardPage />} />
                    <Route path="/dietitian/patients" element={<DietitianPatientsPage />} />
                    <Route path="/dietitian/patients/:patientId/analytics" element={<DietitianPatientAnalyticsPage />} />
                    <Route path="/dietitian/patients/:patientId/chat" element={<DietitianChatPage />} />
                    <Route path="/dietitian/patients/:patientId/plan" element={<DietitianMealPlansPage />} />
                    <Route path="/dietitian/chats" element={<DietitianChatsPage />} />
                    <Route path="/dietitian/chats/:patientId" element={<DietitianChatsPage />} />
                    <Route path="/dietitian/profile" element={<DietitianProfilePage />} />
                  </Route>
                </Route>

                {/* Protected Routes (Hospital) */}
                <Route element={<ProtectedRoute role="hospital" />}>
                  <Route element={<MainLayout />}>
                    <Route path="/hospital" element={<Navigate to="/hospital/dashboard" replace />} />
                    <Route path="/hospital/dashboard" element={<HospitalDashboardPage />} />
                    <Route path="/hospital/dietitians" element={<HospitalDietitiansPage />} />
                    <Route path="/hospital/requests" element={<HospitalRequestsPage />} />
                    <Route path="/hospital/profile" element={<HospitalProfilePage />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

