export type DashboardMetrics = {
    kpis: {
        totalVisits: number;
        avgDailyVisits: number;
        timeModificationRate: string; // "XX.X%"
        avgProtocolReviewTime: { avg: string; median: string; buckets: Record<string, number> };
        scheduleCreationRate: string; // "XX.X%"
        calendarAddRate: string; // "XX.X%"
        pdfExportRate: string; // "XX.X%"
    };
    graphs: {
        monthly: { date: string; visits: number; movingAvg: number }[];
        yearly: { month: string; avgDaily: number }[];
    };
    funnel: {
        started: number;
        step2: number;
        generated: number;
    };
    filters: {
        clinics: string[];
        protocols: string[];
    }
};
