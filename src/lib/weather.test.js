import { describe, it, expect, vi } from 'vitest';
import { parseForecast, fetchTwoHourForecast, forecastEmoji, FORECAST_URL } from './weather.js';

const sample = {
  code: 0,
  errorMsg: '',
  data: {
    area_metadata: [],
    items: [
      {
        update_timestamp: '2026-11-19T07:30:00+08:00',
        timestamp: '2026-11-19T07:30:00+08:00',
        valid_period: { start: '', end: '', text: '7.30 am to 9.30 am' },
        forecasts: [
          { area: 'Bedok', forecast: 'Showers' },
          { area: 'Ang Mo Kio', forecast: 'Thundery Showers' },
        ],
      },
    ],
  },
};

describe('parseForecast', () => {
  it('normalises the API response', () => {
    const r = parseForecast(sample);
    expect(r.areas).toEqual(['Ang Mo Kio', 'Bedok']);
    expect(r.forecasts.Bedok).toBe('Showers');
    expect(r.period).toBe('7.30 am to 9.30 am');
  });

  it('throws when there is no data', () => {
    expect(() => parseForecast({ code: 0, data: { items: [] } })).toThrow(/No forecast/);
    expect(() => parseForecast({})).toThrow(/No forecast/);
  });

  it('throws the API error message on non-zero code', () => {
    expect(() => parseForecast({ code: 5, errorMsg: 'boom' })).toThrow('boom');
  });
});

describe('fetchTwoHourForecast', () => {
  it('calls the data.gov.sg endpoint and parses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => sample });
    const r = await fetchTwoHourForecast(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(FORECAST_URL);
    expect(r.areas).toHaveLength(2);
  });

  it('gives a friendly message on 429', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    await expect(fetchTwoHourForecast(fetchImpl)).rejects.toThrow(/Too many requests/);
  });

  it('reports other HTTP errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(fetchTwoHourForecast(fetchImpl)).rejects.toThrow(/500/);
  });
});

describe('forecastEmoji', () => {
  it.each([
    ['Thundery Showers', '⛈️'],
    ['Light Rain', '🌦️'],
    ['Partly Cloudy (Day)', '⛅'],
    ['Cloudy', '☁️'],
    ['Fair (Day)', '☀️'],
    ['Something odd', '🌡️'],
  ])('%s → %s', (text, emoji) => {
    expect(forecastEmoji(text)).toBe(emoji);
  });
});