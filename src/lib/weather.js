export const FORECAST_URL = 'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast';

export async function fetchTwoHourForecast(fetchImpl = fetch) {
  const res = await fetchImpl(FORECAST_URL);
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? 'Too many requests to the weather service. Please try again in a moment.'
        : `Weather service returned an error (${res.status}).`
    );
  }
  const json = await res.json();
  return parseForecast(json);
}

export function parseForecast(json) {
  if (json?.code !== undefined && json.code !== 0) {
    throw new Error(json.errorMsg || 'Weather service returned an error.');
  }
  const item = json?.data?.items?.[0];
  if (!item || !Array.isArray(item.forecasts)) {
    throw new Error('No forecast data available right now.');
  }
  const forecasts = {};
  for (const f of item.forecasts) forecasts[f.area] = f.forecast;

  return {
    areas: Object.keys(forecasts).sort((a, b) => a.localeCompare(b)),
    forecasts,
    period: item.valid_period?.text ?? '',
    updated: item.update_timestamp ?? item.timestamp ?? '',
  };
}

export function forecastEmoji(text = '') {
  const t = text.toLowerCase();
  if (t.includes('thunder')) return '⛈️';
  if (t.includes('heavy') && t.includes('rain')) return '🌧️';
  if (t.includes('rain') || t.includes('shower') || t.includes('drizzle')) return '🌦️';
  if (t.includes('haze') || t.includes('hazy')) return '😶‍🌫️';
  if (t.includes('windy')) return '💨';
  if (t.includes('fog') || t.includes('mist')) return '🌫️';
  if (t.includes('partly')) return '⛅';
  if (t.includes('cloud') || t.includes('overcast')) return '☁️';
  if (t.includes('fair') && t.includes('night')) return '🌙';
  if (t.includes('fair') || t.includes('sunny')) return '☀️';
  return '🌡️';
}