// types/activity.ts
export interface Activity {
    id: number;
    title: string;
    date: string;
    start_time?: string;
    end_time?: string;
    extra_details?: {
        training_type?: string;
    };
}