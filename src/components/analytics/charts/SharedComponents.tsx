// Shared chart components

export const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((p: any) => {
                        // Handle normalized values: check dataKey for "Pct" suffix
                        const dataKey = p.dataKey;
                        const isPct = typeof dataKey === 'string' && dataKey.endsWith('Pct');
                        const originalName = isPct ? dataKey.replace('Pct', '') : p.name;

                        // Value is either directly in payload, or we look it up in payload[0].payload (or p.payload) for the original data
                        // p.payload refers to the data object for this X-axis point
                        const displayValue = isPct && p.payload[originalName] !== undefined
                            ? p.payload[originalName]
                            : p.value;

                        if (displayValue === null || displayValue === undefined) {
                            return null;
                        }

                        return (
                            <div key={p.name} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.payload?.fill || p.payload?.color }} />
                                <span className="text-gray-600">{originalName}:</span>
                                <span className="font-semibold text-gray-900">
                                    {Number(displayValue).toFixed(1)}
                                    {['Calories', 'Target'].includes(originalName) ? ' kcal' :
                                        originalName === 'Weight' || originalName === 'Recorded Weight' ? ' kg' :
                                        ['Sodium', 'Cholesterol'].includes(originalName) ? ' mg' : 'g'}
                                    {isPct && <span className="text-xs text-gray-400 ml-1">({Number(p.value).toFixed(0)}%)</span>}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    return null;
};
