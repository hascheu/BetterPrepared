classDiagram
    direction TB

    class User {
        +int user_id
        +String name
        +String email
        +String password
    }

    class Profile {
        +int profile_id
        +int user_id
        +Enum sport_type
        +Enum chronical_disease
        +Enum status
    }

    class Activity {
        +int activity_id
        +int profile_id
        +Enum activity_type
        +Enum flexibility
        +Enum frequency
        +int priority
        +DateTime start_time
        +DateTime end_time
    }

    class Training {
        +int activity_id
        +Enum training_type
        +Enum intensity
        +int heart_rate
        +int rpe
    }

    class Responsibility {
        +int activity_id
        +Enum resp_type
        +Enum movement
        +int rpe
    }

    class Recovery {
        +int activity_id
        +Enum recovery_type
        +Enum sub_type
    }

    class Competition {
        +int activity_id
        +Enum status
        +Enum result
        +float fighting_weight
    }

    class DailyMetric {
        +int metric_id
        +int profile_id
        +Date date
        +int sleep
        +int mood
        +float weight
        +Enum energy
        +Enum cycle_phase
    }

    %% Relationships
    User "1" -- "1" Profile : has
    Profile "1" -- "n" Activity : plans
    Profile "1" -- "n" DailyMetric : logs
    Activity "1" -- "0..1" Training : specialized_as
    Activity "1" -- "0..1" Responsibility : specialized_as
    Activity "1" -- "0..1" Recovery : specialized_as
    Activity "1" -- "0..1" Competition : is_part_of