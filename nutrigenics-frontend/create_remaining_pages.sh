#!/bin/bash

# Create remaining dietitian pages
for page in DietitianChatsPage DietitianChatPage DietitianPatientAnalyticsPage DietitianProfilePage DietitianOnboardingPage; do
cat > "src/pages/dietitian/${page}.tsx" << INNER_EOF
import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';

export default function ${page}() {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">${page}</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
      <Card className="p-12 text-center">
        <h2 className="text-2xl font-bold text-black mb-4">This page is under construction</h2>
        <p className="text-gray-600">We're working on bringing you this feature soon.</p>
      </Card>
    </MainLayout>
  );
}
INNER_EOF
done

# Create hospital pages
for page in HospitalDashboardPage HospitalOnboardingPage HospitalRequestsPage HospitalProfilePage; do
cat > "src/pages/hospital/${page}.tsx" << INNER_EOF
import { MainLayout } from '@/layouts/MainLayout';
import { Card } from '@/components/ui/card';

export default function ${page}() {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-black mb-2">${page}</h1>
        <p className="text-gray-600">Coming soon</p>
      </div>
      <Card className="p-12 text-center">
        <h2 className="text-2xl font-bold text-black mb-4">This page is under construction</h2>
        <p className="text-gray-600">We're working on bringing you this feature soon.</p>
      </Card>
    </MainLayout>
  );
}
INNER_EOF
done

# Create static pages  
for page in AboutPage PrivacyPage ContactPage NotFoundPage; do
cat > "src/pages/${page}.tsx" << INNER_EOF
export default function ${page}() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-4xl font-bold mb-4 text-black">${page}</h1>
        <p className="text-gray-600 mb-6">This page will be added soon.</p>
        <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
      </div>
    </div>
  );
}
INNER_EOF
done

echo "All remaining pages created!"
