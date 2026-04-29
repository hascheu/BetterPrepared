erDiagram
    USER ||--o{ WORKOUT : "erstellt"
    WORKOUT ||--|{ EXERCISE_LOG : "beinhaltet"
    EXERCISE ||--o{ EXERCISE_LOG : "wird protokolliert"
    
    USER {
        string username
        string email
    }
    WORKOUT {
        string title
        datetime date
    }

    