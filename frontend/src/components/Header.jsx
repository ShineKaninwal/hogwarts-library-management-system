import React from 'react';

export default function Header() {
  return (
    <>
      <div className="stars"></div>
      <header className="masthead">
        <div className="candles">
          <div className="candle"></div><div className="candle"></div><div className="candle"></div>
          <div className="candle"></div><div className="candle"></div>
        </div>
        <h1>The Hogwarts Library Registry</h1>
        <p className="sub">— issued by quill, tracked by charm, returned before the Restricted Section notices —</p>
        <div className="crest-row">
          <span className="crest-dot" style={{ color: '#7f0909', background: '#7f0909' }}></span>
          <span className="crest-dot" style={{ color: '#1a472a', background: '#1a472a' }}></span>
          <span className="crest-dot" style={{ color: '#222f5b', background: '#222f5b' }}></span>
          <span className="crest-dot" style={{ color: '#ecb939', background: '#ecb939' }}></span>
        </div>
      </header>
    </>
  );
}
