# AgriLens Rwanda

A farmer-focused agriculture dashboard for exploring crop productivity across Rwanda’s 30 districts. The React application compares observed survey results with input scenarios and offers practical, survey-grounded guidance.

## What the dashboard communicates

AgriLens presents district and crop productivity summaries from Rwanda’s Agricultural Household Survey (AHS) 2024. Its maps compare observed district yield with available survey input scenarios, while district details summarize yields and relevant farm conditions. The application is exploratory decision support: survey associations do not prove that a practice caused a yield change, and scenario values are not guaranteed forecasts.

There is no connected live weather or rainfall feed in this release. Any weather-related advice is general; the dashboard does not display a verified next-season rainfall forecast.

## Data

- **Source:** AHS 2024 agricultural household survey microdata, obtained from the [NISR Microdata Portal](https://microdata.statistics.gov.rw/).
- **Local source files:** `HarvestGap_Rwanda/data/Microdata/` (Stata `.dta` survey modules). These source files are not intended for redistribution; check the NISR access terms before sharing them.
- **Dashboard data:** `HarvestGap_Rwanda/web/public/data/agrilens.json`, containing the district boundaries and aggregated data consumed by the React app.
- **Generated outputs:** cleaned tables, reports, and model artifacts are under `HarvestGap_Rwanda/data/processed/`, `HarvestGap_Rwanda/data/public/`, `HarvestGap_Rwanda/reports/`, and `HarvestGap_Rwanda/models/` after running the pipeline.

The cleaning workflow normalizes blank strings and non-finite values and flags duplicates for review without silently deleting them. It does not fill unanswered survey responses with invented values. Model pipelines impute missing predictor values using statistics learned from their training rows. Check the questionnaire and data dictionary to confirm units and category codes before interpreting results.

## How to use the application

On the home dashboard, choose a district and crop or select a district on either map. The two maps show observed productivity and the available input scenario side by side. District rotation can be paused, and hovering over the map pauses the rotation. Open a district report to inspect its summarized data. Farmers can also use the harvest estimate and AgriLens AI assistant for follow-up questions; the assistant provides local, rule-based guidance rather than a live expert or hosted AI service. The language control switches supported interface content between English and Kinyarwanda.

## Run locally

Requirements: Node.js 18+ for the web application. Python 3.10–3.12 is needed only to rebuild the data workflow and model artifacts. From the repository root:

```powershell
cd HarvestGap_Rwanda/web
npm install
npm run dev
```

Vite serves the app locally (normally at `http://localhost:5173`). The dashboard data is already bundled in `web/public/data/agrilens.json`; starting the web app does not require a database or Python process.

To rebuild the data and model workflow on Windows, install the packages once and run the project script from `HarvestGap_Rwanda`:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\run_pipeline.ps1
```

The pipeline audits and cleans the supplied microdata, builds crop features, trains available models, and exports dashboard data. It expects the source survey files in `data/Microdata/` (or `data/raw/`). Do not commit restricted raw survey records. Python model artifacts are used by the analysis workflow; the browser dashboard uses the exported JSON.

For a production build, run `npm run build` from `HarvestGap_Rwanda/web`. `HarvestGap_Rwanda/web/vercel.json` contains the Vercel routing configuration.

## Repository contents and submission checklist

The project source and data assets are organized as follows:

 **Project scripts:** `HarvestGap_Rwanda/analysis/`, `HarvestGap_Rwanda/src/`, `HarvestGap_Rwanda/run_pipeline.ps1`, and `HarvestGap_Rwanda/web/` contain the data workflow, prediction utilities, and application source.
 ##Demo video: this video shows how AgriLens works
  https://drive.google.com/file/d/1CWVvEgbLkQdAhwSHPf1iCyZ___MLqJaM/view?usp=sharing
  
   **Data:** aggregated application data is in `HarvestGap_Rwanda/web/public/data/agrilens.json`. The original AHS data is available through the NISR Microdata Portal and is kept local because access/redistribution terms apply; the pipeline can regenerate derived outputs when authorized source files are available.
 **Eligibility documents:** add the official student cards or other eligibility documents for both team members in the submission repository, only where permitted. These documents are not currently present.

