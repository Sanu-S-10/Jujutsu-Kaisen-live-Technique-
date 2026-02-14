import { useState } from 'react';
import './App.css';
import HandTracker from './components/HandTracker';

export default function App() {
  const [currentTech, setCurrentTech] = useState('neutral');

  const techStyles = {
    red: { color: '#ff3333', label: 'Reverse Cursed Technique: Red' },
    blue: { color: '#00b7ff', label: 'Lapse Technique: Blue' },
    purple: { color: '#bb00ff', label: 'Secret Technique: Hollow Purple' },
    shrine: { color: '#ff0000', label: 'Domain Expansion: Malevolent Shrine' },
    blackhole: { color: '#9b9bb3', label: 'Singularity: Black Hole' },
    neutral: { color: '#cccccc', label: 'Neutral State' },
  };

  const current = techStyles[currentTech] || techStyles.neutral;

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', margin: 0, padding: 0 }}>
      <HandTracker onTechChange={setCurrentTech} />

      <div
        style={{
          position: 'absolute',
          top: '10%',
          width: '100%',
          textAlign: 'center',
          color: '#fff',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: '3rem',
            margin: 0,
            letterSpacing: '10px',
            fontWeight: 900,
            textShadow: '0 0 20px rgba(0, 0, 0, 0.3)',
            background: 'linear-gradient(to bottom, #fff, #888)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          JUJUTSU KAISEN
        </h1>
        <div
          style={{
            fontSize: '1.2rem',
            color: current.color,
            marginTop: '15px',
            fontWeight: 'bold',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
            transition: 'color 0.3s',
          }}
        >
          {current.label}
        </div>
      </div>
    </div>
  );
}
