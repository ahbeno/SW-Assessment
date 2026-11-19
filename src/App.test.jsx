import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import UenValidator from './components/UenValidator.jsx';
import WeatherForecast from './components/WeatherForecast.jsx';

const forecastData = {
  areas: ['Ang Mo Kio', 'Bedok', 'City'],
  forecasts: { 'Ang Mo Kio': 'Thundery Showers', Bedok: 'Showers', City: 'Fair (Day)' },
  period: '2.00 pm to 4.00 pm',
  updated: '',
};

describe('App', () => {
  it('shows two buttons, Validate UEN on the left and Check Weather on the right', () => {
    render(<App />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Validate UEN', 'Check Weather']);
  });

  it('opens the UEN panel when its button is clicked', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Validate UEN' }));
    expect(screen.getByRole('heading', { name: 'Validate UEN' })).toBeInTheDocument();
  });
});

describe('UenValidator', () => {
  it('shows a success message for a valid UEN', async () => {
    render(<UenValidator />);
    await userEvent.type(screen.getByLabelText('UEN'), 'T08LL1234A');
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('status')).toHaveTextContent('Valid format');
    expect(screen.getByRole('status')).toHaveTextContent('Limited Liability Partnership');
  });

  it('shows an error for an invalid UEN', async () => {
    render(<UenValidator />);
    await userEvent.type(screen.getByLabelText('UEN'), 'abc');
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid UEN');
  });

  it('clears the previous result when the input changes', async () => {
    render(<UenValidator />);
    const input = screen.getByLabelText('UEN');
    await userEvent.type(input, '12345678A{enter}');
    expect(screen.getByRole('status')).toBeInTheDocument();
    await userEvent.type(input, 'X');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('WeatherForecast', () => {
  it('loads areas and shows the forecast for a chosen location', async () => {
    const fetcher = vi.fn().mockResolvedValue(forecastData);
    render(<WeatherForecast fetcher={fetcher} />);
    await userEvent.type(await screen.findByLabelText('Location'), 'bedok');
    expect(screen.getByRole('status')).toHaveTextContent('Showers');
    expect(screen.getByRole('status')).toHaveTextContent('2.00 pm to 4.00 pm');
  });

  it('supports quick-pick chips', async () => {
    render(<WeatherForecast fetcher={vi.fn().mockResolvedValue(forecastData)} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Ang Mo Kio' }));
    expect(screen.getByRole('status')).toHaveTextContent('Thundery Showers');
  });

  it('shows an error for an unknown location', async () => {
    render(<WeatherForecast fetcher={vi.fn().mockResolvedValue(forecastData)} />);
    await userEvent.type(await screen.findByLabelText('Location'), 'Atlantis');
    expect(screen.getByRole('alert')).toHaveTextContent('Location not found');
  });

  it('shows an error and retry when the API fails', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce(forecastData);
    render(<WeatherForecast fetcher={fetcher} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByLabelText('Location')).toBeInTheDocument());
  });
});