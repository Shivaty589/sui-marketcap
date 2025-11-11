import React from "react";

export default function Home() {
  return (
    <div className="maintenance" style={{
      background: 'linear-gradient(135deg, #0e1117 0%, #1a1d23 50%, #0b132b 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      textAlign: 'center'
    }}>
      {/* Maintenance Icon */}
      <div className="animate-pulse" style={{
        fontSize: '4em',
        marginBottom: '30px'
      }}>
        🔧
      </div>

      {/* Main Title */}
      <h1 style={{
        color: '#38bdf8',
        fontSize: '3em',
        marginBottom: '20px',
        textShadow: '0 2px 4px rgba(56, 189, 248, 0.3)',
        fontWeight: 'bold'
      }}>
        Website Under Maintenance
      </h1>

      {/* Subtitle */}
      <h2 style={{
        color: '#ffffff',
        fontSize: '1.5em',
        marginBottom: '30px',
        fontWeight: '300'
      }}>
        We're working hard to bring you something amazing!
      </h2>

      {/* Message */}
      <div style={{
        background: 'rgba(11, 19, 43, 0.8)',
        borderRadius: '16px',
        padding: '30px',
        margin: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        maxWidth: '600px'
      }}>
        <p style={{
          color: '#cccccc',
          fontSize: '1.2em',
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Our team is currently performing maintenance to improve your experience.
          We'll be back soon with exciting new features and enhancements.
        </p>

        <div style={{
          color: '#38bdf8',
          fontSize: '1.4em',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          Expected Return: November 17th
        </div>

        <div style={{
          color: '#888',
          fontSize: '0.9em'
        }}>
          Stay tuned for more surprises! 🚀
        </div>
      </div>

      {/* Progress Indicator */}
      <div style={{
        marginTop: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          borderRadius: '10px',
          height: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #38bdf8, #06b6d4)',
            height: '100%',
            width: '75%',
            animation: 'progress 3s ease-in-out infinite'
          }}></div>
        </div>
        <div style={{
          color: '#888',
          fontSize: '0.8em',
          marginTop: '10px'
        }}>
          Progress: 75% Complete
        </div>
      </div>

      {/* Twitter Link */}
      <div style={{
        marginTop: '50px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <a
          href="https://twitter.com/suimarketcap"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#38bdf8',
            textDecoration: 'none',
            fontSize: '1.2em',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: '2px solid #38bdf8',
            borderRadius: '25px',
            transition: 'all 0.3s ease',
            background: 'rgba(56, 189, 248, 0.1)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.2)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(56, 189, 248, 0.1)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Follow us on Twitter
        </a>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 75%; }
          100% { width: 75%; }
        }
      `}</style>
    </div>
  );
}
