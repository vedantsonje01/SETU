# Kumbh Setu

> A bridge to reunite families separated at the Kumbh Mela.

## Overview

At the Kumbh Mela, tens of millions of pilgrims gather in one place, and thousands of people get separated from their families every day, most often elderly pilgrims and young children. The traditional lost-and-found process is slow and fragmented: a person found at one center is invisible to a family searching at another.

Kumbh Setu closes that gap. It is a single, shared system that lets any help center register a found person, take a missing-person report from a family, and instantly search across every center at once. It is built for the people who actually need it, including those with no phone, no app, and no ability to read more than a few digits.

## Who it is for

- **Families** searching for a missing relative.
- **Operators** at help centers who register people and run searches.
- **Volunteers** who bring distressed people to a center.
- **Administrators** who monitor the situation and plan help coverage.

## Features

- **Register a found person** brought to a center, then search for their family.
- **Take a missing-person report** from a family and search every center at once.
- **Live similarity prediction** while filling a report, showing similar existing records ranked by a match score so duplicates and cross-center matches surface early.
- **Smart search** across the whole registry by description, ranked by likelihood.
- **Cross-center matching** that links a found person with a family's report and closes both records together.
- **6-digit token** handed to families so they can check status at any center, anytime, with no phone or app.
- **Case dashboard** with search, filters, aging cases, one-tap escalation to the nearest police station, and hospital-transfer recording.
- **Collector dashboard** with live counts, a coverage map, busiest "rush" areas, a pending-cases breakdown, and zone-wise statistics.
- **Optional name, photo, and proximity** details to improve and speed up reunification.
- **Safety band (QR) scanner** for extreme cases such as small children or people with dementia: scan a pre-issued band and the family contact card appears instantly.
- **Multilingual interface and voice input** for capturing descriptions in the family's language.
- **Works without a name** as the primary identifier, and designed to keep working in difficult, low-connectivity conditions.

## How it works

1. A volunteer brings a found person to a center, or a family arrives to report someone missing.
2. The operator captures a few details. Matching is suggested in seconds, with the reasons for each match shown.
3. If a match is confirmed, the family is contacted and both records are resolved.
4. If not, the case stays open and is searchable everywhere. The family gets a token to check back.
5. Cases left unresolved are flagged and can be escalated to the police.
6. Administrators watch the whole picture live and decide where to place more help.

## Getting started

1. Install the project dependencies.
2. Start the development server.
3. Open the local address shown in the terminal.

To prepare a deployable version, create a production build and serve the generated output.

## Privacy and responsible use

- Built with privacy by design: a name is optional, and status is shared with families only through a token.
- Matching is decision support, not proof. A person's identity is always confirmed by an operator before records are closed.
- The included data is synthetic. No real personal information is present.

## Project status

This is a working prototype. It demonstrates the full end-to-end experience on sample data and is intended as a foundation to extend into a production deployment.

## Acknowledgements

- Built for the Claude Impact Lab, Mumbai 2026.
- Geography and reference data adapted from material provided for the program. Missing-person records are fully synthetic.

## License

Released for the Claude Impact Lab. Add a license of your choice before any wider distribution.
