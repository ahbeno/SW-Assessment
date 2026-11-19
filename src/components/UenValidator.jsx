import { useState } from 'react';
import { validateUEN } from '../lib/uen.js';

export default function UenValidator() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    setResult(validateUEN(value));
  };

  return (
    <section className="panel" aria-labelledby="uen-title">
      <h2 id="uen-title" className="panel-title">Validate UEN</h2>
      <p className="panel-desc">
        Check that a Singapore Unique Entity Number matches one of the official formats.
      </p>

      <form onSubmit={onSubmit} className="row">
        <label htmlFor="uen-input" className="sr-only">UEN</label>
        <input
          id="uen-input"
          className="input"
          type="text"
          placeholder="e.g. 199012345X"
          value={value}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
        />
        <button type="submit" className="btn btn-primary">Check</button>
      </form>

      {result && result.valid && (
        <div className="callout callout-success" role="status">
          <strong>✓ Valid format</strong>
          <span className="callout-sub">{result.label}</span>
          <dl className="details">
            <dt>UEN</dt>
            <dd>{result.uen}</dd>
            {result.details.year && (<><dt>Year</dt><dd>{result.details.year}</dd></>)}
            {result.details.entityTypeCode && (
              <>
                <dt>Entity type</dt>
                <dd>{result.details.entityTypeCode} – {result.details.entityType}</dd>
                <dt>Issued by</dt>
                <dd>{result.details.issuedBy}</dd>
              </>
            )}
            <dt>Number</dt>
            <dd>{result.details.number}</dd>
            <dt>Check letter</dt>
            <dd>{result.details.checkLetter}</dd>
          </dl>
        </div>
      )}

      {result && !result.valid && (
        <div className="callout callout-error" role="alert">
          <strong>✕ Invalid UEN</strong>
          <span className="callout-sub">{result.error}</span>
        </div>
      )}

      <p className="hint">
        Formats: <code>nnnnnnnnX</code> · <code>yyyynnnnnX</code> · <code>TyyPQnnnnX</code>.
        Format check only; the check letter and registration are not verified.
      </p>
    </section>
  );
}