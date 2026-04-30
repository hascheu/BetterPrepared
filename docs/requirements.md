# Project Drivers 

- Supporting athletes in planning their optimal training and working week
- Supporting recovery and training
- Reduction of cognitive load 

Stakeholder
- Athletes
- Trainers

# Project Constraints

- DSGVO (system may contain sensitive data)
    - account protected with password and username 
    - save storage of data and only if necessary
    - automatic data deletion after two years
    - Art. 9 DSGVO: possibly tracking of Special Categories of Personal Data (menstrual cycle, illness, chronical disease)
    - checkbox: "I consent to BetterPrepared processing my health-related data (e.g., sleep patterns, symptoms of illness, menstrual cycle) to generate personalized training and recovery recommendations. I understand that I can withdraw this consent at any time with effect for the future in my profile settings."
- uni project (no budget, limited time for development)
- limited capacities of user to feed system with data 

# Scope of the Work and the Product

background:
- amateure athletes in competetive context may have a high training load (some have the same training load as professionals), but they don't have the same ressources that professionals have
    - danger of overtraining
- difficult to train, manage responsibilities outside of the sport and find time for recovery and social activities 
- goal is to design a system that supports athletes in managing their responsibilities 

major functions:
1. Users can add an activity 
- type: training, responsibilites (work, studies), recovery (social activities, rest)
- flexibility: fix, flexible, free, optional
- frequency: once, daily, weekly, monthly
- priority
- date, time (+ duration), location
2. System suggests weekly plan 
- user can edit plan
- system warns if there are conflicts

Extras:
- transfer data from other systems and devices (synchronization with google calender, smartwatch, apple health etc.)
- system gives training and recovery advices (e.g. "training today was hard, tomorrow you should rest")
- gamification (personalized avatar, avatar is getting sick if user doesn't recovery or sleep enough)

# Datamodel and Data-dictionary

## Datamodel

1. User
- Credentials: name, e-mail, password (automatic in Django)

2. Profile
- every Profile is connected with one User (1..1)
- may contain additional information 
    - type of sport
    - chronical diseases
    - status of the avatar

3. Activity
- connected with one Profile (n..1)
- contains information on
    - type (Training, Responsibility, Recovery)
    - flexibility (fix, flexible, free, optional)
    - frequency (daily, weekly, monthly)
    - priority
    - date, time (start time, end time)

4. Training
- every Training is one Acitivity (1..1)
- type of training (technical, sparring, pads)
- intensity
- duration
- average heart rate
- may be connected to external device or system 
- RPE "Rate of Perceived Exertion" (1 to 10)

5. Responsibilty
- every Responsibility is one Activity (1..1)
- type of Responsibility (work, university, internship, school etc.)
- physical demand: most of the time sitting, standing, walking, lifting
- RPE "Rate of Perceived Exertion" (1 to 10)

6. Recovery
- every Recovery is connected with one Activity (1..1)
- type of recovery (active recovery, passive recovery)
- active recovery (slow running, swimming, yoga, stretching etc.)
- passive recovery (ice bath, sauna, massage, powernap etc.)
- social acitivities 

7. Competition
- every Competition is connected with one Activity (n..1)
- date of competition
- status: past, confirmed, planned
- fighting weight
- result (if status past)

8. Daily Metric
- every Daily Metric is connected with one Profile (n..1)
- date
- current weight
- sleep
- illness
- mood
- menstrual cycle

## Data-dictionary

### User

| **Attribute** | **Data Type** | **Description** |
| user_id | int | id for the identification of the user |
| name | String | name of the user |
| e-mail | String | mail adress of the user |
| password | String| user chooses a password (8 digits, containing letters, numbers and special characters) |

### Profile

| **Attribute** | **Data Type** | **Description** |
| profile_id | int | id for the identification of the profile |
| user_id | int | user_id of the connected user account |
| sport_type  | enum | optional |
| chronical_disease | enum | optional |
| status  | enum | optional |

### Activity

| **Attribute** | **Data Type** | **Description** |
| activity_id | int | id for the identification of the activity |
| profile_id | int | id of the connected profile |
| activity_type  | enum | type: fix, flexible, free, optional |
| frequency | enum | daily, weekly, monthly, yearly |
| priority  | enum | 1 to 10 |
| date_time  | DateTimeField | start_time, end_time, date |

### Training

| **Attribute** | **Data Type** | **Description** |
| training_id | int | id for the identification of the training |
| activity_id | int | id of the connected activity |
| training_type  | enum | type: technical, sparring, pads, bagwork |
| intensity| enum | high, medium, low |
| heart_rate | int | average heart rate during the session |
| rpe | int | Rate of Perceived Exertion (1 to 10) |

### Responsibilty

| **Attribute** | **Data Type** | **Description** |
| responsibility_id | int | id for the identification of the responsibility |
| activity_id | int | id of the connected activity |
| responsibility_type  | enum | type: work, university, internship, school, others |
| movement| enum | sitting, standing, walking, liftingt |
| rpe | int | Rate of Perceived Exertion (1 to 10) |

### Recovery

| **Attribute** | **Data Type** | **Description** |
| recovery_id | int | id for the identification of the recovery |
| activity_id | int | id of the connected activity |
| recovery_type | enum | type: active, passive, social|
| active_recovery | enum | type: running, swimming, yoga, stretching, other |
| passive_recovery| enum | type: ice bath, sauna, massage, powernap, other |
| rpe | int | Rate of Perceived Exertion (1 to 10) |

### Competition

| **Attribute** | **Data Type** | **Description** |
| competition_id | int | id for the identification of the competition |
| activity_id | int | id of the connected activity |
| status | enum | confirmed, planned, completed, cancelled |
| result | enum | if past competition: win, loss, draw, free text field for aditional thoughts (tpye of loss and win) |
| fighting_weight | int | registered weight for the competition |

### Daily Metric

| **Attribute** | **Data Type** | **Description** |
| metric_id | int | id for the identification of the metric |
| profile_id | int | id of the connected profile |
| date | date | date when the metric has been tracked |
| sleep | int | number of hours sleep |
| mood | int | 1-10 |
| current_weight | float | current weight of the user (additional: tracked in the morning, afternoon, evening)|
| energy | enum | high, low, middle|
| menstrual_cycle | enum | menstruation, follicular, ovulation, luteal |

# Functional Requirements

# Non-functional Requirements
• Was sind (selbstverständliche) Erwartungen an das System?
– Look and feel
– Usability and humanity
– Performance
– Wartbarkeit- und Support
– Sicherheit
– Kulturell und politisch
– Gesetzliche
