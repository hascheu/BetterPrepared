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




Activity

Foreign Key: user_id (Jeder Eintrag gehört einem User).

Kategorie: Enum (Training, Work, Recovery, Social).

Flexibility: Enum (Fix, Flexible, Optional).

Zeitdaten: Start-Zeit, End-Zeit (oder Duration), Datum.

Wiederholung: recurrence_rule (dafür gibt es in Django gute Bibliotheken).

Status: (Planned, Completed, Skipped) – wichtig für den Gamification-Avatar!

Relation:

## Data-dictionary


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
