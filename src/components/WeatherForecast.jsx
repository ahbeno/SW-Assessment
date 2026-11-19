import { useEffect, useMemo, useState } from 'react';
import { fetchTwoHourForecast, forecastEmoji } from '../lib/weather.js';

const MAX_SUGGESTIONS = 8;

export function getSuggestions(areas, query, limit = MAX_SUGGESTIONS) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const prefix = [];
  const contains = [];
  for (const a of areas) {
    const name = a.toLowerCase();
    if (name.startsWith(q)) prefix.push(a);
    else if (name.includes(q)) contains.push(a);
  }
  return [...prefix, ...contains].slice(0, limit);
}

function Highlight({ text, query }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export default function WeatherForecast({ fetcher = fetchTwoHourForecast }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const load = () => {
    setLoading(true);
    setError('');
    fetcher()
      .then((d) => setData(d))
      .catch((e) => setError(e.message || 'Failed to load forecast.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const q = query.trim();
  const matchedArea = data?.areas.find((a) => a.toLowerCase() === q.toLowerCase());
  const suggestions = useMemo(
    () => (data ? getSuggestions(data.areas, query) : []),
    [data, query]
  );

  const showList =
    open &&
    suggestions.length > 0 &&
    !(suggestions.length === 1 && suggestions[0].toLowerCase() === q.toLowerCase());

  const forecast = matchedArea ? data.forecasts[matchedArea] : null;
  const typedButUnknown = q && !matchedArea && suggestions.length === 0;

  useEffect(() => {
    if (!showList) return;
    document.getElementById(`area-opt-${active}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active, showList]);

  const choose = (area) => {
    setQuery(area);
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showList) setOpen(true);
      else setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showList) setOpen(true);
      else setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (showList) {
        e.preventDefault();
        choose(suggestions[active] ?? suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="weather-title">
      <h2 id="weather-title" className="panel-title">Check Weather</h2>
      <p className="panel-desc">2-hour weather forecast for locations across Singapore.</p>

      {loading && <p className="muted" role="status">Loading forecast…</p>}

      {error && (
        <div className="callout callout-error" role="alert">
          <strong>Couldn’t load the forecast</strong>
          <span className="callout-sub">{error}</span>
          <button className="btn btn-ghost" onClick={load}>Try again</button>
        </div>
      )}

      {data && (
        <>
          <div className="row">
            <div className="combo">
              <label htmlFor="area-input" className="sr-only">Location</label>
              <input
                id="area-input"
                className="input"
                type="text"
                role="combobox"
                aria-expanded={showList}
                aria-controls="area-listbox"
                aria-autocomplete="list"
                aria-activedescendant={showList ? `area-opt-${active}` : undefined}
                placeholder="Search a location, e.g. Hougang"
                value={query}
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setActive(0);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
              />

              {showList && (
                <ul id="area-listbox" className="combo-list" role="listbox" aria-label="Suggested locations">
                  {suggestions.map((area, i) => (
                    <li
                      key={area}
                      id={`area-opt-${i}`}
                      role="option"
                      aria-label={area}
                      aria-selected={i === active}
                      className={`combo-option ${i === active ? 'combo-option-active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(area);
                      }}
                      onMouseEnter={() => setActive(i)}
                    >
                      <Highlight text={area} query={query} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="chips" aria-label="Quick picks">
            {['Ang Mo Kio', 'Bedok', 'Jurong West', 'Woodlands', 'City', 'Tampines']
              .filter((a) => data.areas.includes(a))
              .map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`chip ${matchedArea === a ? 'chip-active' : ''}`}
                  onClick={() => choose(a)}
                >
                  {a}
                </button>
              ))}
          </div>

          {forecast && (
            <div className="callout callout-weather" role="status">
              <span className="weather-emoji" aria-hidden="true">{forecastEmoji(forecast)}</span>
              <div>
                <strong>{matchedArea}</strong>
                <div className="weather-text">{forecast}</div>
                <div className="muted">
                  {data.period && <>Valid {data.period}</>}
                </div>
              </div>
            </div>
          )}

          {typedButUnknown && (
            <div className="callout callout-error" role="alert">
              <strong>Location not found</strong>
              <span className="callout-sub">“{query}” isn’t a recognised forecast area in Singapore.</span>
            </div>
          )}

          <p className="hint">Source: data.gov.sg / NEA · {data.areas.length} areas</p>
        </>
      )}
    </section>
  );
}