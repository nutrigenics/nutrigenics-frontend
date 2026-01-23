#!/bin/bash

# Create patient portal placeholders
cat > src/pages/patient/DashboardPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function DashboardPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/RecipesPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function RecipesPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Recipes</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/RecipeDetailPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function RecipeDetailPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Recipe Detail</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/SearchRecipesPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function SearchRecipesPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Search Recipes</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/MealPlanPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function MealPlanPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Meal Plan</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/AnalyticsPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Analytics</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/AIChatPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function AIChatPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">AI Chat</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/BookmarksPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function BookmarksPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Bookmarks</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/ProfilePage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function ProfilePage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Profile</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/MyDietitianPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function MyDietitianPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">My Dietitian</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

cat > src/pages/patient/MyDietitianChatPage.tsx << 'INNER_EOF'
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function MyDietitianChatPage() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">Dietitian Chat</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF

# Create dietitian portal placeholders
for page in DietitianDashboardPage DietitianPatientsPage DietitianChatsPage DietitianChatPage DietitianPatientAnalyticsPage DietitianProfilePage DietitianOnboardingPage; do
cat > "src/pages/dietitian/${page}.tsx" << INNER_EOF
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function ${page}() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">${page}</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF
done

# Create hospital portal placeholders
for page in HospitalDashboardPage HospitalOnboardingPage HospitalRequestsPage HospitalProfilePage; do
cat > "src/pages/hospital/${page}.tsx" << INNER_EOF
import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';

export default function ${page}() {
  return (
    <MainLayout>
      <h1 className="text-4xl font-bold mb-4">${page}</h1>
      <p>Under construction</p>
    </MainLayout>
  );
}
INNER_EOF
done

# Create static pages
for page in AboutPage PrivacyPage ContactPage NotFoundPage; do
cat > "src/pages/${page}.tsx" << INNER_EOF
import React from 'react';

export default function ${page}() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">${page}</h1>
        <p className="text-gray-600 mb-6">Coming soon</p>
      </div>
    </div>
  );
}
INNER_EOF
done

echo "All placeholder pages created!"
