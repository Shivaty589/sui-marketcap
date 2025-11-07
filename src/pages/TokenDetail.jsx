import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function TokenDetail() {
  const { symbol } = useParams();
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetch("https://corsproxy.io/?https://api.suivision.xyz/v1/market/coins")
      .then((res) => res.json())
      .then((data) => {
        const match = data.data.find((t) => t.symbol === symbol);
        setToken(match);
      })
      .catch((err) => console.error("Error fetching token:", err));
  }, [symbol]);

  if (!token) return <p>Loading...</p>;

  const data = {
    labels: ["1h", "2h", "3h", "4h", "5h", "6h"],
    datasets: [
      {
        label: `${token.symbol} Price`,
        data: [token.price_usd * 0.9, token.price_usd, token.price_usd * 1.05],
        borderColor: "#38bdf8",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="detail">
      <Link to="/">← Back</Link>
      <h2>{token.symbol} Details</h2>
      <p>Price: ${token.price_usd.toFixed(3)}</p>
      <p>Market Cap: ${(token.market_cap / 1e6).toFixed(2)}M</p>
      <p>Volume: ${(token.volume_24h / 1e6).toFixed(2)}M</p>
      {/* Chart removed to fix build error */}
      <p>Chart functionality temporarily disabled</p>
    </div>
  );
}
