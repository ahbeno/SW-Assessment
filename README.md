# SW Assessment Readme

- **Validate UEN** – checks a Singapore Unique Entity Number.
- **Check Weather** – shows the NEA 2hr weather forecast for any area in sg through API.

## Prerequisites

- [Node.js](https://nodejs.org) 18 or newer (20+ recommended)
- npm (bundled with Node)
- Internet access (for API)

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (default <http://localhost:3000>).

## Other commands

| Command | What it does |
| --- | --- |
| `npm test` | Run the unit tests once |

## UEN formats

| Entity type | Format | Length | Example |
| --- | --- | --- | --- |
| Business (ACRA) | `nnnnnnnnX` | 9 | `12345678A` |
| Local Company (ACRA) | `yyyynnnnnX` | 10 | `199012345X` |
| Other Registered Entity | `TyyPQnnnnX` | 10 | `T08LL1234A` |

For `TyyPQnnnnX`, `T` = 2000s, `S` = 1900s, `R` = 1800s; `PQ` must be one of the entity-type indicators in `src/lib/uen.js` (e.g. `LL`, `SS`, `CC`, `GA`...).

Additional checks: the year must be between 1800 and the current year, and the input is trimmed and upper-cased automatically.

> **Scope note:** this is a *format* validator. It does not compute the ACRA check-letter algorithm and cannot confirm that a UEN is actually registered. To verify registration, use the official [ACRA / data.gov.sg UEN lookup](https://data.gov.sg).

## Weather

The forecast is fetched once when the Check Weather panel opens from
`https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast`. Type or pick from the list of ~47 areas (e.g. *Bedok*, *Ang Mo Kio*, *City*), or use the quick-pick chips. If the API is unavailable or rate-limited, an error with a **Try again** button is shown.

## Project structure

```
sw-assessment/
├── index.html                  
├── package.json                 
├── vite.config.js             
├── README.md
└── src/
    ├── main.jsx                 
    ├── App.jsx                  
    ├── App.test.jsx              
    ├── setupTests.js             
    ├── styles.css                
    ├── components/
    │   ├── UenValidator.jsx     
    │   └── WeatherForecast.jsx   
    └── lib/
        ├── uen.js                
        ├── uen.test.js          
        ├── weather.js           
        └── weather.test.js      
```

## Testing

```bash
npm test
```

Covers: all three UEN formats and their edge cases, every entity-type indicator, year-boundary logic, API parsing and error handling (with mocked `fetch`), and React component behaviour (button order, valid/invalid UEN, location search, error + retry). No network access is needed to run the tests.

