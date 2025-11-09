import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    price_usd: "",
    market_cap: "",
    volume_24h: "",
    change_24h: "",
    image: "",
    owner: "",
    category: "global", // "global" or "sui"
    contractAddress: ""
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [adminTokens, setAdminTokens] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hashed admin password (bcrypt hash of the secure password)
  const ADMIN_PASSWORD_HASH = "$2a$10$yjw2D4E1U/lRMft2lZakGu3vN4JqDAaS7d2a15jyItxZikENEaFW2";

  // Simple bcrypt verification (in production, use proper backend auth)
  const verifyPassword = async (inputPassword) => {
    // For demo purposes, we'll do a simple hash comparison
    // In production, this should be done on the server-side
    try {
      // Using Web Crypto API for basic hashing (not as secure as bcrypt but works for demo)
      const encoder = new TextEncoder();
      const data = encoder.encode(inputPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // For now, we'll use a simple comparison - replace with proper bcrypt verification
      return inputPassword === "suiowner2024"; // Temporary fallback
    } catch (error) {
      console.error("Password verification error:", error);
      return false;
    }
  };

  useEffect(() => {
    // Load admin tokens from localStorage
    const savedTokens = localStorage.getItem("adminTokens");
    if (savedTokens) {
      setAdminTokens(JSON.parse(savedTokens));
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
    } else {
      setError("Invalid password");
    }
  };

  // Helper function to call Sui RPC
  const callSuiRPC = async (method, params) => {
    const response = await fetch('https://fullnode.mainnet.sui.io:443', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  };

  // Helper function to get Sui coin metadata
  const getSuiCoinMetadata = async (coinType) => {
    try {
      // First try the newer suix_getCoinMetadata method
      return await callSuiRPC('suix_getCoinMetadata', [coinType]);
    } catch (error) {
      console.log('suix_getCoinMetadata failed, trying sui_getCoinMetadata:', error);
      try {
        // Fallback to older method
        return await callSuiRPC('sui_getCoinMetadata', [coinType]);
      } catch (error2) {
        console.log('sui_getCoinMetadata also failed:', error2);
        throw error2;
      }
    }
  };

  const verifyToken = async () => {
    if (!formData.symbol.trim() && !formData.contractAddress.trim()) {
      setVerificationResult({ success: false, message: "Please enter a token symbol or contract address" });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // If Sui ecosystem token, try Sui-specific APIs first
      if (formData.category === "sui") {
        // If contract address is provided, try fetching from Sui RPC
        if (formData.contractAddress) {
          try {
            const metadata = await getSuiCoinMetadata(formData.contractAddress);
            if (metadata) {
              const tokenSymbol = metadata.symbol?.toUpperCase() || formData.symbol.toUpperCase();

              // Try to get price data from SuiVision using the symbol
              let priceData = null;
              try {
                const suiMarketResponse = await fetch("https://api.suivision.xyz/v1/market/coins");
                if (suiMarketResponse.ok) {
                  const suiMarketData = await suiMarketResponse.json();
                  const foundToken = suiMarketData.data?.find(coin =>
                    coin.symbol.toUpperCase() === tokenSymbol ||
                    coin.name.toLowerCase() === (metadata.name || formData.name).toLowerCase()
                  );
                  if (foundToken) {
                    priceData = {
                      price_usd: foundToken.price_usd?.toString() || formData.price_usd,
                      market_cap: foundToken.market_cap?.toString() || formData.market_cap,
                      volume_24h: foundToken.volume_24h?.toString() || formData.volume_24h,
                      change_24h: foundToken.price_change_24h?.toString() || formData.change_24h,
                      image: foundToken.logo_url || metadata.iconUrl || formData.image
                    };
                  }
                }
              } catch (error) {
                console.error("SuiVision price fetch error:", error);
              }

              // If no price data from SuiVision, try CoinGecko
              if (!priceData || !priceData.price_usd) {
                try {
                  const searchResponse = await fetch(
                    `https://api.coingecko.com/api/v3/search?query=${tokenSymbol.toLowerCase()}`
                  );
                  if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    const foundCoin = searchData.coins?.find(coin =>
                      coin.symbol.toLowerCase() === tokenSymbol.toLowerCase() ||
                      coin.name.toLowerCase() === (metadata.name || formData.name).toLowerCase()
                    );
                    if (foundCoin) {
                      const coinDetailsResponse = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${foundCoin.id}`
                      );
                      if (coinDetailsResponse.ok) {
                        const coinData = await coinDetailsResponse.json();
                        priceData = {
                          price_usd: coinData.market_data?.current_price?.usd?.toString() || priceData?.price_usd || formData.price_usd,
                          market_cap: coinData.market_data?.market_cap?.usd?.toString() || priceData?.market_cap || formData.market_cap,
                          volume_24h: coinData.market_data?.total_volume?.usd?.toString() || priceData?.volume_24h || formData.volume_24h,
                          change_24h: coinData.market_data?.price_change_percentage_24h?.toString() || priceData?.change_24h || formData.change_24h,
                          image: coinData.image?.large || coinData.image?.small || priceData?.image || metadata.iconUrl || formData.image
                        };
                      }
                    }
                  }
                } catch (error) {
                  console.error("CoinGecko price fetch error:", error);
                }
              }

              setVerificationResult({
                success: true,
                message: "Sui token verified successfully via Sui RPC",
                data: {
                  name: metadata.name || formData.name,
                  symbol: tokenSymbol,
                  price_usd: priceData?.price_usd || formData.price_usd,
                  market_cap: priceData?.market_cap || formData.market_cap,
                  volume_24h: priceData?.volume_24h || formData.volume_24h,
                  change_24h: priceData?.change_24h || formData.change_24h,
                  image: priceData?.image || metadata.iconUrl || formData.image
                }
              });
              return;
            }
          } catch (error) {
            console.error("Sui RPC verification error:", error);
          }
        }

        // Try SuiVision market coins API for symbol lookup
        try {
          const suiMarketResponse = await fetch("https://api.suivision.xyz/v1/market/coins");
          if (suiMarketResponse.ok) {
            const suiMarketData = await suiMarketResponse.json();
            const foundToken = suiMarketData.data?.find(coin =>
              coin.symbol.toLowerCase() === formData.symbol.toLowerCase() ||
              coin.name.toLowerCase() === formData.name.toLowerCase()
            );

            if (foundToken) {
              setVerificationResult({
                success: true,
                message: "Sui token verified successfully via SuiVision",
                data: {
                  name: foundToken.name || formData.name,
                  symbol: foundToken.symbol?.toUpperCase() || formData.symbol.toUpperCase(),
                  price_usd: foundToken.price_usd?.toString() || formData.price_usd,
                  market_cap: foundToken.market_cap?.toString() || formData.market_cap,
                  volume_24h: foundToken.volume_24h?.toString() || formData.volume_24h,
                  change_24h: foundToken.price_change_24h?.toString() || formData.change_24h,
                  image: foundToken.logo_url || formData.image
                }
              });
              return;
            }
          }
        } catch (error) {
          console.error("SuiVision market API error:", error);
        }

        // Try standard CoinGecko simple price API only for SUI token
        if (formData.symbol.toLowerCase() === 'sui') {
          const suiPriceResponse = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
          );

          if (suiPriceResponse.ok) {
            const suiData = await suiPriceResponse.json();
            if (suiData.sui) {
              setVerificationResult({
                success: true,
                message: "Sui token verified successfully via CoinGecko",
                data: {
                  name: "Sui",
                  symbol: "SUI",
                  price_usd: suiData.sui.usd?.toString() || formData.price_usd,
                  market_cap: suiData.sui.usd_market_cap?.toString() || formData.market_cap,
                  volume_24h: suiData.sui.usd_24h_vol?.toString() || formData.volume_24h,
                  change_24h: suiData.sui.usd_24h_change?.toString() || formData.change_24h,
                  image: "https://assets.coingecko.com/coins/images/26375/thumb/sui_asset.jpeg"
                }
              });
              return;
            }
          }
        }

        // If no Sui token found, set failure for Sui category
        setVerificationResult({
          success: false,
          message: "Sui token not found. Please check the symbol or contract address, or add manually."
        });
        return;
      }

      // For global tokens, try searching for the specific token first
      const searchResponse = await fetch(
        `https://api.coingecko.com/api/v3/search?query=${formData.symbol.toLowerCase()}`
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const foundCoin = searchData.coins?.find(coin =>
          coin.symbol.toLowerCase() === formData.symbol.toLowerCase()
        );

        if (foundCoin) {
          // Get detailed coin data
          const coinDetailsResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${foundCoin.id}`
          );

          if (coinDetailsResponse.ok) {
            const coinData = await coinDetailsResponse.json();
            setVerificationResult({
              success: true,
              message: "Token verified successfully via CoinGecko",
              data: {
                name: coinData.name || formData.name,
                symbol: coinData.symbol?.toUpperCase() || formData.symbol.toUpperCase(),
                price_usd: coinData.market_data?.current_price?.usd?.toString() || formData.price_usd,
                market_cap: coinData.market_data?.market_cap?.usd?.toString() || formData.market_cap,
                volume_24h: coinData.market_data?.total_volume?.usd?.toString() || formData.volume_24h,
                change_24h: coinData.market_data?.price_change_percentage_24h?.toString() || formData.change_24h,
                image: coinData.image?.large || coinData.image?.small || formData.image
              }
            });
            return;
          }
        }
      }

      // Fallback to Binance API
      const binanceResponse = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${formData.symbol.toUpperCase()}USDT`
      );

      if (binanceResponse.ok) {
        const binanceData = await binanceResponse.json();
        setVerificationResult({
          success: true,
          message: "Token verified successfully via Binance",
          data: {
            name: formData.name || formData.symbol.toUpperCase(),
            symbol: formData.symbol.toUpperCase(),
            price_usd: binanceData.lastPrice || formData.price_usd,
            market_cap: formData.market_cap, // Binance doesn't provide market cap
            volume_24h: binanceData.volume || formData.volume_24h,
            change_24h: binanceData.priceChangePercent || formData.change_24h,
            image: formData.image
          }
        });
      } else {
        setVerificationResult({
          success: false,
          message: `Token not found on ${formData.category === "sui" ? "Sui APIs" : "CoinGecko or Binance"}. You can still add it manually.`
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        message: "Verification failed. Please check your internet connection."
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddToken = () => {
    if (!formData.name || !formData.symbol || !formData.owner) {
      setError("Please fill in name, symbol, and owner");
      return;
    }

    const tokenData = verificationResult?.success ? verificationResult.data : formData;

    const newToken = {
      id: `admin-${Date.now()}`,
      rank: adminTokens.length + 1,
      name: tokenData.name,
      symbol: tokenData.symbol.toUpperCase(),
      image: tokenData.image || "",
      price_usd: parseFloat(tokenData.price_usd || 0).toFixed(4),
      volume_24h: parseFloat(tokenData.volume_24h || 0),
      change_24h: parseFloat(tokenData.change_24h || 0).toFixed(2),
      market_cap: parseFloat(tokenData.market_cap || 0),
      owner: formData.owner,
      category: formData.category,
      isAdminToken: true,
      priceChange: 'same'
    };

    const updatedTokens = [...adminTokens, newToken];
    setAdminTokens(updatedTokens);
    localStorage.setItem("adminTokens", JSON.stringify(updatedTokens));
    window.dispatchEvent(new CustomEvent('adminTokensUpdated'));

    // Reset form
    setFormData({
      name: "",
      symbol: "",
      price_usd: "",
      market_cap: "",
      volume_24h: "",
      change_24h: "",
      image: "",
      owner: "",
      category: "global",
      contractAddress: ""
    });
    setVerificationResult(null);
    setError("");
  };

  const handleDeleteToken = (tokenId) => {
    const updatedTokens = adminTokens.filter(token => token.id !== tokenId);
    setAdminTokens(updatedTokens);
    localStorage.setItem("adminTokens", JSON.stringify(updatedTokens));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowPasswordPrompt(true);
    setPassword("");
    navigate("/");
  };

  if (showPasswordPrompt) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0e1117 0%, #1a1d23 50%, #0b132b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(11, 19, 43, 0.9)',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h2 style={{ color: '#38bdf8', textAlign: 'center', marginBottom: '30px' }}>Admin Access</h2>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white',
                fontSize: '1em',
                marginBottom: '20px'
              }}
            />
            {error && <div style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: '#38bdf8',
                color: 'white',
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1em',
                fontWeight: 'bold'
              }}
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0e1117 0%, #1a1d23 50%, #0b132b 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ color: '#38bdf8', fontSize: '2.5em', textShadow: '0 2px 4px rgba(56, 189, 248, 0.3)' }}>
            Admin Dashboard
          </h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>

        {/* Token Addition Form */}
        <div style={{
          background: 'rgba(11, 19, 43, 0.9)',
          borderRadius: '16px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '20px' }}>Add New Token</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white'
              }}
            >
              <option value="global">🌍 Global Market</option>
              <option value="sui">🐱 Sui Ecosystem</option>
            </select>
            <input
              type="text"
              name="name"
              placeholder="Token Name"
              value={formData.name}
              onChange={handleInputChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white'
              }}
            />
            <input
              type="text"
              name="symbol"
              placeholder="Token Symbol (e.g., BTC)"
              value={formData.symbol}
              onChange={handleInputChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white'
              }}
            />
            {formData.category === "sui" && (
              <input
                type="text"
                name="contractAddress"
                placeholder="Contract Address (Sui)"
                value={formData.contractAddress}
                onChange={handleInputChange}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  background: 'rgba(45, 55, 72, 0.8)',
                  color: 'white'
                }}
              />
            )}
            <input
              type="text"
              name="owner"
              placeholder="Owner Name"
              value={formData.owner}
              onChange={handleInputChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white'
              }}
            />
            <input
              type="url"
              name="image"
              placeholder="Token Image URL (optional)"
              value={formData.image}
              onChange={handleInputChange}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                background: 'rgba(45, 55, 72, 0.8)',
                color: 'white'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={verifyToken}
              disabled={isVerifying}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                opacity: isVerifying ? 0.6 : 1
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Token'}
            </button>
            <button
              onClick={handleAddToken}
              style={{
                backgroundColor: '#38bdf8',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Add Token
            </button>
          </div>

          {verificationResult && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: verificationResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              border: `1px solid ${verificationResult.success ? '#10b981' : '#dc2626'}`,
              color: verificationResult.success ? '#10b981' : '#dc2626'
            }}>
              {verificationResult.message}
            </div>
          )}

          {error && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid #dc2626',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Admin Tokens List */}
        <div style={{
          background: 'rgba(11, 19, 43, 0.9)',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ color: '#38bdf8', marginBottom: '20px' }}>Managed Tokens ({adminTokens.length})</h2>

          {adminTokens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
              No tokens added yet. Add your first token above.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'rgba(11, 19, 43, 0.8)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(31, 64, 104, 0.8)' }}>
                    <th style={{ padding: '15px', textAlign: 'left', color: '#38bdf8' }}>Token</th>
                    <th style={{ padding: '15px', textAlign: 'right', color: '#38bdf8' }}>Price</th>
                    <th style={{ padding: '15px', textAlign: 'right', color: '#38bdf8' }}>Market Cap</th>
                    <th style={{ padding: '15px', textAlign: 'right', color: '#38bdf8' }}>Owner</th>
                    <th style={{ padding: '15px', textAlign: 'center', color: '#38bdf8' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminTokens.map((token) => (
                    <tr key={token.id} style={{ borderBottom: '1px solid rgba(28, 40, 65, 0.5)' }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {token.image && (
                            <img
                              src={token.image}
                              alt={token.name}
                              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <div>
                            <div style={{ color: 'white', fontWeight: 'bold' }}>{token.name}</div>
                            <div style={{ color: '#888', fontSize: '0.9em' }}>{token.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', color: 'white' }}>${token.price_usd}</td>
                      <td style={{ padding: '15px', textAlign: 'right', color: 'white' }}>
                        {token.market_cap ? `$${parseFloat(token.market_cap).toLocaleString()}` : 'N/A'}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right', color: '#38bdf8', fontWeight: 'bold' }}>
                        {token.owner}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          style={{
                            backgroundColor: '#dc2626',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9em'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
