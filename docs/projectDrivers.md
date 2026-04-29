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
- uni project (no budget, limited time for development)
- limited capacities of user to feed system with data 

# Scope of the Work and the Product

background:
- amateure athletes in competetive context may have a high training load (some have the same training load as professionals), but they don't have the same ressources that professionals have
    - danger of overtraining
- difficult to train, manage responsibilities outside of the sport and find time for recovery and social activities 
- goal is to design a system that supports athletes in managing their responsibilities 

major functions:
1. Users can add an Appointment 
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

1. Account
- Credentials (name, e-mail, password) 
- has calender with appointments
2. Appointment
- contains information on type, flexibility, frquency, priority, date, time etc. of an appointment
3. Calendar
- show the user their appointments
- different views (day, week, month)

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
