import React from "react";

export default function TokenTable({ tokens }) {
  return (
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
            <td>{t.name} ({t.symbol})</td>
            <td>${t.price_usd?.toFixed(3)}</td>
            <td style={{ color: t.change_24h > 0 ? "lime" : "red" }}>
              {t.change_24h?.toFixed(2)}%
            </td>
            <td>${(t.volume_24h / 1e6).toFixed(2)}M</td>
            <td>${(t.market_cap / 1e6).toFixed(2)}M</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
