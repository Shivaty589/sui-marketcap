import React, { useEffect, useState, useMemo } from "react";
import TokenTable from "../components/TokenTable";

export default function Home({ searchQuery }) {
  const [globalTokens, setGlobalTokens] = useState([]);
  const [suiTokens, setSuiTokens] = useState([]);
  const [adminTokens, setAdminTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousPrices, setPreviousPrices] = useState({});
  const [suiPreviousPrices, setSuiPreviousPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('global');
  const [globalSortConfig, setGlobalSortConfig] = useState({ key: 'market_cap', direction: 'desc' });
  const [suiSortConfig, setSuiSortConfig] = useState({ key: 'market_cap', direction: 'desc' });
  const [globalCurrentPage, setGlobalCurrentPage] = useState(1);
  const [suiCurrentPage, setSuiCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume24h: 0,
    btcDominance: 0,
    activeCryptocurrencies: 0
  });

  const handleGlobalSort = (key) => {
    setGlobalSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSuiSort = (key) => {
    setSuiSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedGlobalTokens = useMemo(() => {
    return [...globalTokens].sort((a, b) => {
      const aValue = parseFloat(a[globalSortConfig.key]) || 0;
      const bValue = parseFloat(b[globalSortConfig.key]) || 0;
      if (globalSortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [globalTokens, globalSortConfig]);

  const sortedSuiTokens = useMemo(() => {
    return [...suiTokens].sort((a, b) => {
      const aValue = parseFloat(a[suiSortConfig.key]) || 0;
      const bValue = parseFloat(b[suiSortConfig.key]) || 0;
      if (suiSortConfig.direction === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [suiTokens, suiSortConfig]);

  const filteredGlobalTokens = useMemo(() => {
    if (!searchQuery) return sortedGlobalTokens;
    return sortedGlobalTokens.filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedGlobalTokens, searchQuery]);

  const filteredSuiTokens = useMemo(() => {
    if (!searchQuery) return sortedSuiTokens;
    return sortedSuiTokens.filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedSuiTokens, searchQuery]);

  // Pagination logic
  const paginatedGlobalTokens = useMemo(() => {
    const startIndex = (globalCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredGlobalTokens.slice(startIndex, endIndex);
  }, [filteredGlobalTokens, globalCurrentPage, itemsPerPage]);

  const paginatedSuiTokens = useMemo(() => {
    const startIndex = (suiCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSuiTokens.slice(startIndex, endIndex);
  }, [filteredSuiTokens, suiCurrentPage, itemsPerPage]);

  const totalGlobalPages = Math.ceil(filteredGlobalTokens.length / itemsPerPage);
  const totalSuiPages = Math.ceil(filteredSuiTokens.length / itemsPerPage);

  const handleGlobalPageChange = (page) => {
    setGlobalCurrentPage(page);
  };

  const handleSuiPageChange = (page) => {
    setSuiCurrentPage(page);
  };

  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const fetchGlobalTokens = async () => {
    console.log("Fetching global tokens from multiple APIs...");
    try {
      // Fetch from multiple APIs in parallel, with pagination to get more coins
      const apiPromises = [];

      // CoinGecko: Fetch multiple pages (up to 1000 coins)
      for (let page = 1; page <= 4; page++) {
        apiPromises.push(
          fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`)
            .then(res => res.ok ? res.json() : Promise.reject(`CoinGecko page ${page}: ${res.status}`))
            .then(data => ({ source: 'coingecko', data }))
            .catch(err => ({ source: 'coingecko', error: err, page }))
        );
      }

      // CoinStats: Increased limit to 1000
      apiPromises.push(
        fetch("https://api.coinstats.app/public/v1/coins?skip=0&limit=1000&currency=USD")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinStats: ${res.status}`))
          .then(data => ({ source: 'coinstats', data: data.coins || [] }))
          .catch(err => ({ source: 'coinstats', error: err }))
      );

      // CoinMarketCap: Increased limit to 1000
      apiPromises.push(
        fetch("https://api.coinmarketcap.com/data-api/v3/cryptocurrency/listing?start=1&limit=1000")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinMarketCap: ${res.status}`))
          .then(data => ({ source: 'coinmarketcap', data: data.data?.cryptoCurrencyList || [] }))
          .catch(err => ({ source: 'coinmarketcap', error: err }))
      );

      // CoinPaprika: Increased to 500
      apiPromises.push(
        fetch("https://api.coinpaprika.com/v1/coins")
          .then(res => res.ok ? res.json() : Promise.reject(`CoinPaprika: ${res.status}`))
          .then(data => ({ source: 'coinpaprika', data }))
          .catch(err => ({ source: 'coinpaprika', error: err }))
      );

      // Additional APIs for better reliability
      // CryptoCompare
      apiPromises.push(
        fetch("https://min-api.cryptocompare.com/data/top/totalvolfull?limit=100&tsym=USD")
          .then(res => res.ok ? res.json() : Promise.reject(`CryptoCompare: ${res.status}`))
          .then(data => ({ source: 'cryptocompare', data: data.Data || [] }))
          .catch(err => ({ source: 'cryptocompare', error: err }))
      );

      // Messari API
      apiPromises.push(
        fetch("https://data.messari.io/api/v2/assets?fields=id,name,symbol,metrics/market_data/price_usd,metrics/market_data/volume_last_24_hours,metrics/market_data/percent_change_usd_last_24_hours,metrics/marketcap/current_marketcap_usd&limit=100")
          .then(res => res.ok ? res.json() : Promise.reject(`Messari: ${res.status}`))
          .then(data => ({ source: 'messari', data: data.data || [] }))
          .catch(err => ({ source: 'messari', error: err }))
      );

      const results = await Promise.allSettled(apiPromises);
      console.log("Global API results:", results);

      // Collect all successful data
      let allData = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data && !result.value.error) {
          if (Array.isArray(result.value.data)) {
            allData = allData.concat(result.value.data);
          }
        }
      }

      if (allData.length === 0) {
        throw new Error("All global APIs failed to provide data");
      }

      // Remove duplicates based on symbol (case insensitive)
      const uniqueData = [];
      const seenSymbols = new Set();
      for (const coin of allData) {
        const symbol = (coin.symbol || coin.Symbol || coin.CoinInfo?.Name || '').toLowerCase();
        if (symbol && !seenSymbols.has(symbol)) {
          seenSymbols.add(symbol);
          uniqueData.push(coin);
        }
      }

      console.log(`Collected ${uniqueData.length} unique coins from all sources`);

      // Process data with better error handling
      const processedData = uniqueData.slice(0, 2000).map(coin => ({
        id: coin.id || coin.Id || coin.symbol || coin.CoinInfo?.Name,
        name: coin.name || coin.Name || coin.CoinInfo?.FullName,
        symbol: coin.symbol || coin.Symbol || coin.CoinInfo?.Name,
        image: coin.image || coin.icon || coin.CoinInfo?.ImageUrl || `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png` || '',
        current_price: parseFloat(coin.current_price || coin.price || coin.quotes?.[0]?.price || coin.RAW?.USD?.PRICE || coin.metrics?.market_data?.price_usd) || 0,
        total_volume: parseFloat(coin.total_volume || coin.volume || coin.quotes?.[0]?.volume24h || coin.RAW?.USD?.VOLUME24HOUR || coin.metrics?.market_data?.volume_last_24_hours) || 0,
        price_change_percentage_24h: parseFloat(coin.price_change_percentage_24h || coin.priceChange1d || coin.quotes?.[0]?.percentChange24h || coin.RAW?.USD?.CHANGEPCT24HOUR || coin.metrics?.market_data?.percent_change_usd_last_24_hours) || 0,
        market_cap: parseFloat(coin.market_cap || coin.marketCap || coin.quotes?.[0]?.marketCap || coin.RAW?.USD?.MKTCAP || coin.metrics?.marketcap?.current_marketcap_usd) || 0
      }));

      // Calculate market stats
      const totalMarketCap = processedData.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
      const totalVolume24h = processedData.reduce((sum, coin) => sum + (coin.total_volume || 0), 0);
      const btcData = processedData.find(coin => coin.symbol?.toLowerCase() === 'btc');
      const btcDominance = btcData ? (btcData.market_cap / totalMarketCap) * 100 : 0;

      setMarketStats({
        totalMarketCap,
        totalVolume24h,
        btcDominance,
        activeCryptocurrencies: processedData.length
      });

      const tokens = processedData.map((coin, index) => {
        const currentPrice = parseFloat(coin.current_price) || 0;
        const prevPrice = parseFloat(previousPrices[coin.id]) || currentPrice;
        const priceChangeRealtime = currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : 'same';

        const change24h = parseFloat(coin.price_change_percentage_24h) || 0;
        const priceChange = Object.keys(previousPrices).length === 0 ? (change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'same') : priceChangeRealtime;

        return {
          id: coin.id,
          rank: index + 1,
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

      const newPreviousPrices = {};
      processedData.forEach(coin => {
        if (coin.current_price) {
          newPreviousPrices[coin.id] = coin.current_price;
        }
      });
      setPreviousPrices(newPreviousPrices);

      console.log(`Global tokens processed (${tokens.length} total):`, tokens);
      setGlobalTokens(tokens);
    } catch (err) {
      console.error("All global APIs failed:", err);
      setError(`Global APIs failed: ${err.message}`);
    }
  };

  const fetchSuiTokens = async () => {
    console.log("Fetching Sui tokens...");
    try {
      // Try multiple stable APIs for Sui ecosystem data
      let data = null;
      const apiEndpoints = [
        "https://api.suivision.xyz/v1/market/coins", // Primary
        "https://api.sui.io/v1/coins", // Official Sui API (if available)
        "https://api.allorigins.win/get?url=" + encodeURIComponent("https://api.suivision.xyz/v1/market/coins"), // CORS proxy fallback
      ];

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying Sui API: ${endpoint}`);
          const response = await fetch(endpoint);
          if (response.ok) {
            if (endpoint.includes("allorigins.win")) {
              const proxyData = await response.json();
              data = JSON.parse(proxyData.contents);
            } else {
              data = await response.json();
            }
            console.log(`Successfully fetched from: ${endpoint}`);
            break;
          } else {
            console.warn(`API ${endpoint} failed with status: ${response.status}`);
          }
        } catch (error) {
          console.warn(`API ${endpoint} error:`, error);
        }
      }

      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error("All Sui APIs failed to provide valid data");
      }

      const tokens = data.data.slice(0, 50).map((coin, index) => {
        const currentPrice = parseFloat(coin.price_usd) || 0;
        const prevPrice = parseFloat(suiPreviousPrices[coin.symbol]) || currentPrice;
        const priceChangeRealtime = currentPrice > prevPrice ? 'up' : currentPrice < prevPrice ? 'down' : 'same';

        const change24h = parseFloat(coin.price_change_24h) || 0;
        const priceChange = Object.keys(suiPreviousPrices).length === 0 ? (change24h > 0 ? 'up' : change24h < 0 ? 'down' : 'same') : priceChangeRealtime;

        return {
          id: coin.symbol,
          rank: index + 1,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          image: coin.logo_url || '',
          price_usd: currentPrice.toFixed(6),
          volume_24h: parseFloat(coin.volume_24h) || 0,
          change_24h: coin.price_change_24h ? parseFloat(coin.price_change_24h).toFixed(2) : '0.00',
          market_cap: parseFloat(coin.market_cap) || 0,
          priceChange: priceChange,
        };
      });

      const newSuiPreviousPrices = {};
      data.data.forEach(coin => {
        if (coin.price_usd) {
          newSuiPreviousPrices[coin.symbol] = coin.price_usd;
        }
      });
      setSuiPreviousPrices(newSuiPreviousPrices);

      console.log("Sui tokens processed:", tokens);
      setSuiTokens(tokens);
    } catch (err) {
      console.error("All Sui APIs failed:", err);
      // Don't set global error for Sui API failure, just log it
      console.warn("Sui ecosystem data unavailable, showing global market only");
      setSuiTokens([]); // Set empty array so UI can handle it
    }
  };

  const fetchTokens = async () => {
    setError(null);
    await Promise.all([fetchGlobalTokens(), fetchSuiTokens()]);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    // Load admin tokens from localStorage
    const loadAdminTokens = () => {
      const savedAdminTokens = localStorage.getItem("adminTokens");
      if (savedAdminTokens) {
        setAdminTokens(JSON.parse(savedAdminTokens));
      } else {
        setAdminTokens([]);
      }
    };

    loadAdminTokens();

    // Listen for storage changes (when admin tokens are added/removed)
    const handleStorageChange = (e) => {
      if (e.key === "adminTokens") {
        loadAdminTokens();
      }
    };

    const handleAdminTokensUpdate = () => {
      loadAdminTokens();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("adminTokensUpdated", handleAdminTokensUpdate);

    fetchTokens();
    const interval = setInterval(() => {
      console.log("Auto-refresh triggered");
      fetchTokens();
    }, 30000); // Updated to 30 seconds for more frequent updates

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setGlobalCurrentPage(1);
    setSuiCurrentPage(1);
  }, [searchQuery]);

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
    <div className="home" style={{ background: 'linear-gradient(135deg, #0e1117 0%, #1a1d23 50%, #0b132b 100%)', minHeight: '100vh' }}>
      <h1 style={{ color: '#38bdf8', marginBottom: '30px', fontSize: '2.5em', textShadow: '0 2px 4px rgba(56, 189, 248, 0.3)' }}>Sui MarketCap — Live Tokens</h1>
      <div style={{ color: '#888', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center' }}>
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      {/* Tab Navigation */}
      <div className="tabs" style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('global')}
          className={`tab-button ${activeTab === 'global' ? 'active' : ''}`}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'global' ? '#38bdf8' : '#2d3748',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1em',
            boxShadow: activeTab === 'global' ? '0 4px 12px rgba(56, 189, 248, 0.4)' : '0 2px 6px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          🌍 Global Market
        </button>
        <button
          onClick={() => setActiveTab('sui')}
          className={`tab-button ${activeTab === 'sui' ? 'active' : ''}`}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundColor: activeTab === 'sui' ? '#38bdf8' : '#2d3748',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1em',
            boxShadow: activeTab === 'sui' ? '0 4px 12px rgba(56, 189, 248, 0.4)' : '0 2px 6px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          🐱 Sui Ecosystem
        </button>
      </div>

      {/* Global Market Section */}
      {activeTab === 'global' && (
        <div className="market-section" style={{ background: 'rgba(11, 19, 43, 0.8)', borderRadius: '16px', padding: '20px', margin: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '20px', textAlign: 'center', fontSize: '1.8em', textShadow: '0 2px 4px rgba(56, 189, 248, 0.3)' }}>Global Cryptocurrency Market</h2>

          {/* Market Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.1)';
            }}
            >
              <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '8px' }}>Total Market Cap</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#38bdf8' }}>${formatNumber(marketStats.totalMarketCap)}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.1)';
            }}
            >
              <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '8px' }}>24h Volume</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#38bdf8' }}>${formatNumber(marketStats.totalVolume24h)}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.1)';
            }}
            >
              <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '8px' }}>BTC Dominance</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#38bdf8' }}>{marketStats.btcDominance.toFixed(2)}%</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.05))',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.1)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.1)';
            }}
            >
              <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '8px' }}>Active Cryptocurrencies</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#38bdf8' }}>{formatNumber(marketStats.activeCryptocurrencies)}</div>
            </div>
          </div>

          <TokenTable
            tokens={[...paginatedGlobalTokens, ...adminTokens.filter(token => token.category === 'global')]}
            onSort={handleGlobalSort}
            sortConfig={globalSortConfig}
            isSuiSection={false}
          />
          {/* Pagination Controls */}
          {totalGlobalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '30px',
              gap: '15px',
              padding: '20px',
              background: 'rgba(56, 189, 248, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(56, 189, 248, 0.2)'
            }}>
              <button
                onClick={() => handleGlobalPageChange(globalCurrentPage - 1)}
                disabled={globalCurrentPage === 1}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: globalCurrentPage === 1 ? '#374151' : '#38bdf8',
                  color: 'white',
                  cursor: globalCurrentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: globalCurrentPage === 1 ? 'none' : '0 4px 12px rgba(56, 189, 248, 0.4)',
                  opacity: globalCurrentPage === 1 ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (globalCurrentPage !== 1) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (globalCurrentPage !== 1) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)';
                  }
                }}
              >
                ← Previous
              </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                      {globalCurrentPage}
                    </span>
                    <span style={{ color: 'white', fontSize: '14px' }}>
                      of {totalGlobalPages}
                    </span>
                  </div>

              <button
                onClick={() => handleGlobalPageChange(globalCurrentPage + 1)}
                disabled={globalCurrentPage === totalGlobalPages}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: globalCurrentPage === totalGlobalPages ? '#374151' : '#38bdf8',
                  color: 'white',
                  cursor: globalCurrentPage === totalGlobalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                  boxShadow: globalCurrentPage === totalGlobalPages ? 'none' : '0 4px 12px rgba(56, 189, 248, 0.4)',
                  opacity: globalCurrentPage === totalGlobalPages ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (globalCurrentPage !== totalGlobalPages) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (globalCurrentPage !== totalGlobalPages) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)';
                  }
                }}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sui Ecosystem Section */}
      {activeTab === 'sui' && (
        <div className="market-section" style={{ background: 'rgba(11, 19, 43, 0.8)', borderRadius: '16px', padding: '20px', margin: '20px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '20px', textAlign: 'center', fontSize: '1.8em', textShadow: '0 2px 4px rgba(56, 189, 248, 0.3)' }}>Sui Ecosystem Tokens</h2>
          {(suiTokens.length > 0 || adminTokens.filter(token => token.category === 'sui').length > 0) ? (
            <>
              <TokenTable
                tokens={[...paginatedSuiTokens, ...adminTokens.filter(token => token.category === 'sui')]}
                onSort={handleSuiSort}
                sortConfig={suiSortConfig}
                isSuiSection={true}
              />
              {/* Pagination Controls */}
              {totalSuiPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '30px',
                  gap: '15px',
                  padding: '20px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                  <button
                    onClick={() => handleSuiPageChange(suiCurrentPage - 1)}
                    disabled={suiCurrentPage === 1}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: suiCurrentPage === 1 ? '#374151' : '#38bdf8',
                      color: 'white',
                      cursor: suiCurrentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: suiCurrentPage === 1 ? 'none' : '0 4px 12px rgba(56, 189, 248, 0.4)',
                      opacity: suiCurrentPage === 1 ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (suiCurrentPage !== 1) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (suiCurrentPage !== 1) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)';
                      }
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                      {suiCurrentPage}
                    </span>
                    <span style={{ color: 'white', fontSize: '14px' }}>
                      of {totalSuiPages}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSuiPageChange(suiCurrentPage + 1)}
                    disabled={suiCurrentPage === totalSuiPages}
                    style={{
                      padding: '12px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: suiCurrentPage === totalSuiPages ? '#374151' : '#38bdf8',
                      color: 'white',
                      cursor: suiCurrentPage === totalSuiPages ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: suiCurrentPage === totalSuiPages ? 'none' : '0 4px 12px rgba(56, 189, 248, 0.4)',
                      opacity: suiCurrentPage === totalSuiPages ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (suiCurrentPage !== totalSuiPages) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.6)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (suiCurrentPage !== totalSuiPages) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)';
                      }
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              <div style={{ fontSize: '1.2em', marginBottom: '10px' }}>🐱 Sui Ecosystem Data Unavailable</div>
              <div style={{ fontSize: '0.9em' }}>We're working on fetching Sui ecosystem data. Please check back later or switch to Global Market.</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
