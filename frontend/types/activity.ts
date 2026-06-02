// frontend/types/activity.ts

export type SchedulingType = 'FIXED' | 'FLEXIBLE' | 'FREE' | 'OPTIONAL';
export type FrequencyType = 'ONCE' | 'DAILY' | 'WEEKLY';

interface BaseActivity {
    id: number;
    title: string;
    scheduling_type: SchedulingType;
    is_all_day: boolean;
    frequency: FrequencyType;
    date: string | null;
    weekday: number | null;
    start_time: string | null;
    end_time: string | null;
}

export interface TrainingActivity extends BaseActivity {
    activity_kind: 'TRAINING'; 
    extra_details: {
        training_type?: 'TECHNICAL' | 'SPARRING' | 'PADS' | 'BAGWORK' | null;
        intensity?: 'HIGH' | 'MEDIUM' | 'LOW' | null;
        heart_rate?: number | null;
        rpe?: number | null;
    };
}

export interface RecoveryActivity extends BaseActivity {
    activity_kind: 'RECOVERY';
    extra_details: {
        recovery_type?: 'ACTIVE' | 'PASSIVE' | 'SOCIAL' | null;
        sub_type?: string | null;
    };
}

export interface CompetitionActivity extends BaseActivity {
    activity_kind: 'COMPETITION';
    extra_details: {
        status: 'CONFIRMED' | 'PLANNED' | 'PAST';
        result?: string | null;
        fighting_weight?: number | null;
    };
}

export interface ResponsibilityActivity extends BaseActivity {
    activity_kind: 'RESPONSIBILITY';
    extra_details: {
        responsibility_type?: 'WORK' | 'UNIVERSITY' | 'INTERNSHIP' | 'SCHOOL' | 'OTHERS' | null;
        movement?: 'SITTING' | 'STANDING' | 'WALKING' | 'LIFTING' | null;
        rpe?: number | null;
    };
}

export interface OtherActivity extends BaseActivity {
    activity_kind: 'OTHER';
    extra_details: {
        notes?: string | null;
    };
}

export type Activity = TrainingActivity | RecoveryActivity | CompetitionActivity | ResponsibilityActivity | OtherActivity;