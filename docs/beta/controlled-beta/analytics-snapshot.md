# Controlled Beta Analytics Snapshot

Status: `waiting_for_real_learner_activity`

## Snapshot Rules

- Report aggregate cohort metrics only.
- Do not include raw learner answers, submissions, transcripts, provider payloads, or secrets.
- Teacher/admin data must not be mixed into learner activation or retention metrics.

## Cohort Readout

| Metric | Window | Result | Segment | Interpretation | Owner | Follow-up | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Activation | 24h after onboarding | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate activation readout after learner aliases have activity | `waiting_for_real_learner_activity` |
| D1 retention | Day 1 after activation | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate D1 readout after activation exists | `waiting_for_real_learner_activity` |
| D7 retention | Day 7 after activation | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate D7 readout after cohort window exists | `waiting_for_real_learner_activity` |
| Weekly meaningful CEFR progress | Rolling 7 days | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate weekly progress readout after cohort activity exists | `waiting_for_real_learner_activity` |
| Motivation quality | Cohort window | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate motivation readout after learner activity exists | `waiting_for_real_learner_activity` |
| AI feedback reliability | Cohort window | N/A | Cohort | Community/manual outreach is selected, but no active cohort data exists yet | Data / Analytics Engineer | Add first aggregate AI feedback readout after learner AI use exists | `waiting_for_real_learner_activity` |
