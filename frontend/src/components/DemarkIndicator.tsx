import { DemarkSignal } from '../types';

interface DemarkSignalPoints {
  buyPoints: Array<{x: number, y: number, value: number}>;
  sellPoints: Array<{x: number, y: number, value: number}>;
}

/**
 * Helper function to process Demark Indicator buy/sell signals as data points for chart
 * This is used by StockChart.tsx
 */
const processDemarkSignals = (
  buySignals?: DemarkSignal[], 
  sellSignals?: DemarkSignal[], 
  dates?: string[], 
  prices?: number[]
): DemarkSignalPoints => {
  // Convert dates to timestamps to match StockChart functionality
  const getXPosition = (dateString: string): number => {
    return new Date(dateString).getTime();
  };

  // Map signals to price points
  const buyPoints = buySignals?.map(signal => ({
    x: getXPosition(signal.date),
    y: signal.price,
    value: signal.value
  })) || [];
  
  const sellPoints = sellSignals?.map(signal => ({
    x: getXPosition(signal.date),
    y: signal.price,
    value: signal.value
  })) || [];
  
  return {
    buyPoints,
    sellPoints
  };
};

export default processDemarkSignals;