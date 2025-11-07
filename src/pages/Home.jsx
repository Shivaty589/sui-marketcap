import React, { useEffect, useState } from "react";

export default function Home() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousPrices, setPreviousPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const fetchTokens = async () => {
    console.log("Fetching tokens from multiple APIs...");
    try {
      setError(null);

      // Try multiple APIs in parallel for better reliability
      const apiPromises = [
        // Primary API: CoinGecko
        fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinGecko: ${res.status}`))
          .then(data => ({ source: 'coingecko', data }))
          .catch(err => ({ source: 'coingecko', error: err })),

        // Secondary API: CoinStats
        fetch("https://api.coinstats.app/public/v1/coins?skip=0&limit=50&currency=USD")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinStats: ${res.status}`))
          .then(data => ({ source: 'coinstats', data: data.coins || [] }))
          .catch(err => ({ source: 'coinstats', error: err })),

        // Tertiary API: CoinMarketCap (free tier with images)
        fetch("https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=100")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinMarketCap: ${res.status}`))
          .then(data => ({ source: 'coinmarketcap', data: data.data?.cryptoCurrencyList || [] }))
          .catch(err => ({ source: 'coinmarketcap', error: err })),

        // Quaternary API: CoinPaprika
        fetch("https://api.coinpaprika.com/v1/coins")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinPaprika: ${res.status}`))
          .then(data => ({ source: 'coinpaprika', data }))
          .catch(err => ({ source: 'coinpaprika', error: err }))
      ];

      const results = await Promise.allSettled(apiPromises);
      console.log("API results:", results);

      // Find the first successful API response
      let successfulData = null;
      let dataSource = '';

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data && !result.value.error) {
          successfulData = result.value.data;
          dataSource = result.value.source;
          console.log(`Using data from ${dataSource}`);
          break;
        }
      }

      if (!successfulData || successfulData.length === 0) {
        throw new Error("All APIs failed to provide data");
      }

      // Process data based on source
      let processedData = [];
      if (dataSource === 'coingecko') {
        processedData = successfulData;
      } else if (dataSource === 'coinstats') {
        // Map CoinStats data to CoinGecko format
        processedData = successfulData.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.icon,
          current_price: parseFloat(coin.price) || 0,
          total_volume: parseFloat(coin.volume) || 0,
          price_change_percentage_24h: parseFloat(coin.priceChange1d) || 0,
          market_cap: parseFloat(coin.marketCap) || 0
        }));
      } else if (dataSource === 'coinmarketcap') {
        // Map CoinMarketCap API data to CoinGecko format
        processedData = successfulData.slice(0, 50).map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
          current_price: parseFloat(coin.quotes?.[0]?.price) || 0,
          total_volume: parseFloat(coin.quotes?.[0]?.volume24h) || 0,
          price_change_percentage_24h: parseFloat(coin.quotes?.[0]?.percentChange24h) || 0,
          market_cap: parseFloat(coin.quotes?.[0]?.marketCap) || 0
        }));
      } else if (dataSource === 'coinpaprika') {
        // Map CoinPaprika data to CoinGecko format (limited data)
        processedData = successfulData.slice(0, 50).map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
          current_price: 0, // CoinPaprika doesn't provide price in this endpoint
          total_volume: 0,
          price_change_percentage_24h: 0,
          market_cap: 0
        }));
      }

      const tokens = processedData.map((coin) => {
        const currentPrice = parseFloat(coin.current_price) || 0;
        const prevPrice = parseFloat(previousPrices[coin.id]) || currentPrice;
        const priceChangeRealtime = currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : 'same';

        // Use 24h change for initial display, realtime change for updates
        const change24h = parseFloat(coin.price_change_percentage_24h) || 0;
        const priceChange = Object.keys(previousPrices).length === 0 ? (change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'same') : priceChangeRealtime;

        return {
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          image: coin.image,
          price_usd: currentPrice > 0 ? currentPrice.toFixed(4) : '0.0000',
          volume_24h: parseFloat(coin.total_volume) || 0,
          change_24h: coin.price_change_percentage_24h ? parseFloat(coin.price_change_percentage_24h).toFixed(2) : '0.00',
          market_cap: parseFloat(coin.market_cap) || 0,
          priceChange: priceChange,
        };
      });

      // Update previous prices for next comparison
      const newPreviousPrices = {};
      processedData.forEach(coin => {
        if (coin.current_price) {
          newPreviousPrices[coin.id] = coin.current_price;
        }
      });
      setPreviousPrices(newPreviousPrices);

      console.log(`Tokens processed from ${dataSource}:`, tokens);
      setTokens(tokens);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error("All APIs failed:", err);
      setError(`All APIs failed to provide data. Error: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(() => {
      console.log("Auto-refresh triggered");
      fetchTokens();
    }, 30000); // Updated to 30 seconds for more frequent updates
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ color: "white", textAlign: "center", padding: "50px" }}>
      <div style={{ fontSize: "1.5em", marginBottom: "20px" }}>Loading live tokens...</div>
      <div style={{ display: "inline-block", width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
    </div>
  );

  if (error) return (
    <div style={{ color: "white", textAlign: "center", padding: "50px" }}>
      <div style={{ fontSize: "1.5em", marginBottom: "20px", color: "red" }}>Error loading tokens</div>
      <div style={{ fontSize: "1em", marginBottom: "20px" }}>{error}</div>
      <button
        onClick={fetchTokens}
        style={{
          backgroundColor: '#38bdf8',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="home">
      <h1 style={{ color: '#38bdf8', marginBottom: '30px', fontSize: '2.5em' }}>Sui MarketCap — Live Tokens</h1>
      <div style={{ color: '#888', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center' }}>
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
      <table className="token-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Token</th>
            <th>Price (USD)</th>
            <th>24h Change</th>
            <th>Volume (24h)</th>
            <th>Market Cap</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={t.image} alt={t.name} style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                    <div style={{ color: '#888', fontSize: '0.9em', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.symbol}</div>
                  </div>
                </div>
              </td>
              <td style={{
                color: t.priceChange === 'up' ? 'limegreen' : t.priceChange === 'down' ? 'red' : 'white',
                fontWeight: t.priceChange !== 'same' ? 'bold' : 'normal'
              }}>
                ${t.price_usd}
                {t.priceChange === 'up' && <span style={{ marginLeft: '5px', color: 'limegreen' }}>▲</span>}
                {t.priceChange === 'down' && <span style={{ marginLeft: '5px', color: 'red' }}>▼</span>}
              </td>
              <td style={{ color: parseFloat(t.change_24h) > 0 ? "limegreen" : "red" }}>
                {t.change_24h}%
              </td>
              <td>${formatNumber(t.volume_24h)}</td>
              <td>${formatNumber(t.market_cap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
