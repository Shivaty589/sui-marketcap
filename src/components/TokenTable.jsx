import React, { useState } from "react";

export default function TokenTable({ tokens, onSort, sortConfig, isSuiSection = false }) {
  const formatNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleSort = (key) => {
    onSort(key);
  };

  return (
    <table className="token-table">
      <thead>
        <tr>
          <th onClick={() => handleSort('rank')} style={{ cursor: 'pointer' }}>
            # {getSortIcon('rank')}
          </th>
          <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
            Token {getSortIcon('name')}
          </th>
          <th onClick={() => handleSort('price_usd')} style={{ cursor: 'pointer' }}>
            Price (USD) {getSortIcon('price_usd')}
          </th>
          <th onClick={() => handleSort('change_24h')} style={{ cursor: 'pointer' }}>
            24h Change {getSortIcon('change_24h')}
          </th>
          <th onClick={() => handleSort('volume_24h')} style={{ cursor: 'pointer' }}>
            Volume (24h) {getSortIcon('volume_24h')}
          </th>
          <th onClick={() => handleSort('market_cap')} style={{ cursor: 'pointer' }}>
            Market Cap {getSortIcon('market_cap')}
          </th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((t, i) => (
          <tr key={t.id || i}>
            <td>{t.rank || (i + 1)}</td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {t.image && (
                  <img
                    src={t.image}
                    alt={t.name}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.name}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.9em', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.symbol}
                  </div>
                </div>
              </div>
            </td>
            <td style={{
              color: t.priceChange === 'up' ? 'limegreen' : t.priceChange === 'down' ? 'red' : 'white',
              fontWeight: t.priceChange !== 'same' ? 'bold' : 'normal'
            }}>
              ${parseFloat(t.price_usd || 0).toFixed(isSuiSection ? 6 : 4)}
              {t.priceChange === 'up' && <span style={{ marginLeft: '5px', color: 'limegreen' }}>▲</span>}
              {t.priceChange === 'down' && <span style={{ marginLeft: '5px', color: 'red' }}>▼</span>}
            </td>
            <td style={{ color: parseFloat(t.change_24h || 0) > 0 ? "limegreen" : "red" }}>
              {parseFloat(t.change_24h || 0).toFixed(2)}%
            </td>
            <td>${formatNumber(parseFloat(t.volume_24h || 0))}</td>
            <td>${formatNumber(parseFloat(t.market_cap || 0))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
