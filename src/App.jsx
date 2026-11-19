import { useState } from 'react';
import UenValidator from './components/UenValidator.jsx';
import WeatherForecast from './components/WeatherForecast.jsx';
import './styles.css';

export default function App() {
  const [active, setActive] = useState(null); // 'uen' | 'weather' | null

  const toggle = (key) => setActive((cur) => (cur === key ? null : key));

  return (
    <main className="page">
      <header className="hero">
        <h1 className="hero-title">SW Assessment</h1>
      </header>

      <div className="button-row" role="group" aria-label="Tools">
        <button
          className={`btn btn-lg ${active === 'uen' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={active === 'uen'}
          onClick={() => toggle('uen')}
        >
          Validate UEN
        </button>
        <button
          className={`btn btn-lg ${active === 'weather' ? 'btn-primary' : 'btn-secondary'}`}
          aria-pressed={active === 'weather'}
          onClick={() => toggle('weather')}
        >
          Check Weather
        </button>
      </div>

      <div className="panel-wrap">
        {active === 'uen' && <UenValidator />}
        {active === 'weather' && <WeatherForecast />}
      </div>
    </main>
  );
}