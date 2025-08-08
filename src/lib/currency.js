function round(n) {
  return Math.round(n * 100) / 100;
}

function convertBreakdownUSDToCurrency(breakdown, rate) {
  if (!breakdown || typeof breakdown !== 'object') return breakdown;
  const convert = (v) => round((Number(v) || 0) * rate);
  return {
    subtotal: convert(breakdown.subtotal),
    fees: convert(breakdown.fees),
    taxes: convert(breakdown.taxes),
    total: convert(breakdown.total),
  };
}

module.exports = { convertBreakdownUSDToCurrency };


