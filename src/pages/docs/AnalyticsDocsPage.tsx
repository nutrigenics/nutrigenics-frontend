import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    BarChart2, Activity,
    Zap, Brain,
    FileText, Database, UserCheck
} from 'lucide-react';

export default function AnalyticsDocsPage() {
    return (
        <div className="space-y-10 max-w-5xl animate-in fade-in duration-500">
            {/* Header */}
            <div className="border-b pb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/10">
                        <BarChart2 className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Analytics Reference</h1>
                        <p className="text-lg text-muted-foreground mt-1">
                            Comprehensive technical guide to the Patient Analytics Dashboard.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs font-normal">Version 2.4</Badge>
                    <Badge variant="outline" className="text-xs font-normal">Updated: Jan 2026</Badge>
                </div>
            </div>

            {/* Section: Data Architecture */}
            <section className="space-y-6">
                <SectionHeader
                    icon={<Database className="w-5 h-5 text-blue-600" />}
                    title="Data Input & Source Architecture"
                />
                <Card className="bg-slate-50/50 border-slate-200">
                    <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-gray-500" />
                                User Profile Data
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Static or semi-static data provided by the patient in their profile settings.
                            </p>
                            <ul className="text-sm space-y-2 text-gray-700">
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Weight</span>
                                    <span className="font-mono text-xs text-gray-500">Used for Protein Target (g/kg)</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Height & Age</span>
                                    <span className="font-mono text-xs text-gray-500">Used for TDEE Calculation</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Activity Level</span>
                                    <span className="font-mono text-xs text-gray-500">TDEE Multiplier (1.2 - 1.9)</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                Meal Log Data
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                                Dynamic data aggregated from daily meal submissions.
                            </p>
                            <ul className="text-sm space-y-2 text-gray-700">
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Quantity</span>
                                    <span className="font-mono text-xs text-gray-500">Grams/Ounces/Servings</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Ingredients</span>
                                    <span className="font-mono text-xs text-gray-500">Mapped to USDA Database</span>
                                </li>
                                <li className="flex justify-between border-b border-gray-100 pb-1">
                                    <span>Time</span>
                                    <span className="font-mono text-xs text-gray-500">Meal Slot (Breakfast/Lunch/etc)</span>
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Section: KPIs Deep Dive */}
            <section className="space-y-6">
                <SectionHeader
                    icon={<Activity className="w-5 h-5 text-emerald-600" />}
                    title="Metric Calculation Logic (KPIs)"
                />
                <div className="grid gap-4">
                    <DetailAccordion
                        title="Adherence Rate"
                        badge="Compliance"
                        description="Measures how consistently the patient tracks their meals."
                    >
                        <LogicTable
                            inputs={['Log History (Database)', 'Selected Time Period (7/30/60 days)']}
                            formula="Count(Days with > 0 Logs) / Total Days in Period * 100"
                            output="Percentage (0-100%) + Streak Count"
                            userAction="Log at least one item every day to maintain streak."
                        />
                    </DetailAccordion>

                    <DetailAccordion
                        title="Estimated Weight Impact"
                        badge="Prediction"
                        description="Predicts weekly weight change based on thermodynamic energy balance."
                    >
                        <LogicTable
                            inputs={['Daily Calorie Average (Intake)', 'TDEE (Expenditure)']}
                            formula="((Avg Intake - TDEE) * 7 days) / 7700 kcal"
                            note="7700 kcal is the approximate energy value of 1kg of body fat."
                            output="Weight Change in kg/week (+ or -)"
                            userAction="Ensure Activity Level in profile is accurate for correct TDEE."
                        />
                    </DetailAccordion>

                    <DetailAccordion
                        title="Cardiovascular Score"
                        badge="Health Score"
                        description="Composite risk score for heart health based on American Heart Association guidelines."
                    >
                        <LogicTable
                            inputs={['Sodium (mg)', 'Cholesterol (mg)', 'Saturated Fat (g)']}
                            formula="100 - (PenaltyPoints)"
                            note="Penalties applied: 1 pt per 100mg Sodium > 2300, 5 pts per 1g Sat Fat > 22g."
                            output="Integer Score (0-100)"
                            userAction="Reduce processed foods (Sodium) and red meats (Sat Fat)."
                        />
                    </DetailAccordion>

                    <DetailAccordion
                        title="Glycemic Quality Index"
                        badge="Metabolic"
                        description="Evaluates the potential blood sugar impact of carbohydrate choices."
                    >
                        <LogicTable
                            inputs={['Total Fiber (g)', 'Total Sugar (g)']}
                            formula="Total Fiber / Total Sugar"
                            output="Ratio (Target > 0.2)"
                            userAction="Choose whole fruts (high fiber) over juices/sweets (high sugar)."
                        />
                    </DetailAccordion>
                </div>
            </section>

            {/* Section: Charts Deep Dive */}
            <section className="space-y-6">
                <SectionHeader
                    icon={<Zap className="w-5 h-5 text-amber-600" />}
                    title="Chart Data & Visualizations"
                />

                <div className="grid md:grid-cols-2 gap-6">
                    <ChartCard
                        title="Energy Analysis (Combo Chart)"
                        type="Area + Line"
                        data="Daily Intake vs User Target"
                        explanation="The shaded area represents actual calorie intake. The dashed line is the TDEE target."
                        features={["Gradient Fill for Volume", "Threshold Tooltips"]}
                    />
                    <ChartCard
                        title="Nutrient Trends (Area Chart)"
                        type="Stacked Area"
                        data="Normalized % of Goal"
                        explanation="All nutrients are normalized to 100% of their daily recommended value (RDO) to allow comparison on a single scale."
                        features={["Toggle: Standard Units vs % Goal", "Semi-transparent Overlays"]}
                    />
                    <ChartCard
                        title="Metabolic Matrix (Scatter Plot)"
                        type="XYZ Scatter"
                        data="X=Carbs, Y=Fat, Z=Calories"
                        explanation="Visualizes dietary patterns. Clusters in the top-right indicate 'Cheat Days' (High Fat + High Carb)."
                        features={["Z-Axis Bubble Size", "Quadrant Color Coding"]}
                    />
                    <ChartCard
                        title="Lipid Profile (Donut)"
                        type="Pie / Donut"
                        data="Saturated / Unsaturated / Trans Fat"
                        explanation="Breakdown of fat quality. Green slice (Unsaturated) should ideally be the largest."
                        features={["Interactive Legend", "Hover Details"]}
                    />
                </div>
            </section>

            {/* Section: User Action Guide */}
            <section className="space-y-6">
                <SectionHeader
                    icon={<Brain className="w-5 h-5 text-violet-600" />}
                    title="User Measurement Guidelines"
                />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Data Point</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Update Frequency</th>
                                <th className="px-6 py-4 text-left font-semibold text-gray-700">Best Practice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr>
                                <td className="px-6 py-4 font-medium">Meal Logs</td>
                                <td className="px-6 py-4 text-slate-600">Daily (Per Meal)</td>
                                <td className="px-6 py-4 text-slate-600">Log within 1 hour of eating for best recall accuracy.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Body Weight</td>
                                <td className="px-6 py-4 text-slate-600">Weekly</td>
                                <td className="px-6 py-4 text-slate-600">Weigh in the morning, fasting, same clothing.</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Activity Level</td>
                                <td className="px-6 py-4 text-slate-600">Monthly</td>
                                <td className="px-6 py-4 text-slate-600">Update only if lifestyle changes significantly (e.g., new job).</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-medium">Symptoms</td>
                                <td className="px-6 py-4 text-slate-600">Ad-hoc (As needed)</td>
                                <td className="px-6 py-4 text-slate-600">Log continuously to build Food-Mood correlations.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

// --- Helper Components ---

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            {icon}
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>
    );
}

function DetailAccordion({ title, badge, description, children }: { title: string; badge: string; description: string; children: React.ReactNode }) {
    return (
        <Accordion type="single" collapsible className="w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <AccordionItem value="item-1" className="border-none">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50/50 hover:no-underline rounded-lg">
                    <div className="flex items-center gap-4 text-left">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900">{title}</span>
                                <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal text-gray-500 bg-gray-100">{badge}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 font-normal">{description}</p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="mt-2 pt-4 border-t border-gray-100">
                        {children}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

function LogicTable({ inputs, formula, output, userAction, note }: any) {
    return (
        <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="space-y-4">
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Calculation Formula</span>
                    <div className="font-mono text-xs bg-slate-900 text-slate-50 p-2.5 rounded-md border border-slate-800 shadow-sm relative group overflow-hidden">
                        {formula}
                        {note && <div className="mt-2 pt-2 border-t border-slate-700 text-slate-400 font-sans italic">{note}</div>}
                    </div>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Required Inputs</span>
                    <div className="flex flex-wrap gap-1.5">
                        {inputs.map((i: string) => (
                            <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100 text-xs font-medium">{i}</span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">System Output</span>
                    <p className="text-gray-700 font-medium">{output}</p>
                </div>
                <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">User Requirement</span>
                    <p className="text-gray-700">{userAction}</p>
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, type, data, explanation, features }: any) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-base font-bold">{title}</CardTitle>
                    <Badge variant="outline" className="text-xs font-normal">{type}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 text-sm">
                    <div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Data Set</span>
                        <p className="font-medium text-gray-700">{data}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Concept</span>
                        <p className="text-gray-600 leading-relaxed">{explanation}</p>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 uppercase font-bold">Key Features</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {features.map((f: string) => (
                                <span key={f} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{f}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

