import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  LineController,
  BarController,
  ScatterController,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartData, SupportResistanceLevel } from '../types';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import processDemarkSignals from './DemarkIndicator';
import FullScreenModal from './FullScreenModal';
import { useTheme } from '../context/ThemeContext';

// Register all required components and controllers
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineController,    // Explicitly register the line controller
  BarController,     // Explicitly register the bar controller
  ScatterController, // Explicitly register the scatter controller
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
  zoomPlugin
);

interface Props {
  chartData: ChartData;
  ticker: string;
  supportResistanceLevels: SupportResistanceLevel[];
}

type ChartType = 'line' | 'candlestick';
type TimeInterval = '1d' | 'week' | 'month' | 'year' | 'all';

// Common zoom configuration
const zoomOptions = {
  zoom: {
    wheel: {
      enabled: true,
      speed: 0.05,
      modifierKey: null,
    },
    pinch: {
      enabled: true,
    },
    mode: 'xy' as const,
    drag: {
      enabled: false, // Disable drag-to-zoom to avoid conflict with panning
    },
  },
  pan: {
    enabled: true,
    mode: 'xy' as const,
    modifierKey: null,
    speed: 1.5,
    threshold: 1,
    onPanStart: function(event: any) {
      const target = event.chart.canvas;
      if (target) {
        target.style.cursor = 'grabbing';
      }
    },
    onPanComplete: function(event: any) {
      const target = event.chart.canvas;
      if (target) {
        target.style.cursor = 'grab';
      }
    },
  },
  limits: {
    x: {min: 'original', max: 'original'},
    y: {min: 'original', max: 'original'},
  },
};

// Chart container style will be dynamically generated within the component

const StockChart: React.FC<Props> = ({ chartData, ticker, supportResistanceLevels }) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('all');
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);
  const [fullScreenChart, setFullScreenChart] = useState<string | null>(null);
  const { theme } = useTheme();  // Get current theme
  
  // Define theme-based chart colors
  const chartTheme = {
    textColor: theme === 'dark' ? '#e2e8f0' : '#374151',
    gridColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.1)',
    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',  // Much darker background
    tooltipBackgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.9)',
    tooltipTextColor: theme === 'dark' ? '#f1f5f9' : '#333333',
    // Chart specific colors
    upColor: theme === 'dark' ? '#4ade80' : '#22c55e',       // Brighter green for up candles in dark mode
    downColor: theme === 'dark' ? '#f87171' : '#dc2626',     // Brighter red for down candles in dark mode
    volumeColor: theme === 'dark' ? '#38bdf8' : '#3b82f6',   // Brighter blue for volume
    macdLineColor: theme === 'dark' ? '#38bdf8' : '#3b82f6', // Brighter blue for MACD line
    signalLineColor: theme === 'dark' ? '#f87171' : '#dc2626', // Brighter red for signal line
    histPositiveColor: theme === 'dark' ? '#4ade80' : '#22c55e', // Brighter green for positive histogram
    histNegativeColor: theme === 'dark' ? '#f87171' : '#dc2626', // Brighter red for negative histogram
    rsiLineColor: theme === 'dark' ? '#fbbf24' : '#d97706',  // Brighter amber for RSI
    bollingerColor: theme === 'dark' ? '#a78bfa' : '#7c3aed', // Brighter purple for Bollinger
    labelBackgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.85)',
  };

  const indicatorDescriptions: Record<string, string> = {
    'RSI': 'Relative Strength Index (RSI) measures momentum. Values above 70 indicate overbought conditions (potential price drop), while values below 30 indicate oversold conditions (potential price rise). The RSI helps identify potential reversal points.',
    'MACD': 'Moving Average Convergence Divergence (MACD) identifies trend changes. When the MACD line (blue) crosses above the signal line (red), it\'s a bullish signal. When it crosses below, it\'s bearish. The histogram shows the difference between these lines.',
    'CCI': 'Commodity Channel Index (CCI) identifies cyclical trends. Values above +100 indicate overbought conditions, while values below -100 indicate oversold conditions. CCI helps identify trend reversals and extreme market conditions.',
    'Bollinger': 'Bollinger Bands measure volatility using standard deviations. When bands narrow, it indicates low volatility (squeeze). When price touches the upper band, it may be overbought; touching the lower band may indicate oversold conditions. The middle band is a 20-day moving average.',
    'Demark': 'The Demark Indicator identifies potential price exhaustion points and trend reversals. Buy signals (green triangles) appear after a sequence of lower closes, indicating a potential upward reversal. Sell signals (red triangles) appear after a sequence of higher closes, indicating a potential downward reversal.'
  };
  
  // Force chart re-render when theme changes
  useEffect(() => {
    // The chart will automatically re-render when any of its props or state changes
    // This effect is triggered when theme changes, causing the component to re-render
    // with the new theme colors
  }, [theme]);

  // Define chart container style based on current theme
  const chartContainerStyle = {
    cursor: 'grab',
    backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.5)',
    borderRadius: '8px',
    padding: '12px',
    border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e0e0e0',
  };

  // Chart header component with info icon
  const ChartHeader: React.FC<{ title: string; indicator: string }> = ({ title, indicator }) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      marginBottom: '0.5rem',
      position: 'relative'
    }}>
      <h3 style={{ 
        fontSize: '16px', 
        fontWeight: 600, 
        margin: 0,
        color: chartTheme.textColor
      }}>
        {title}
      </h3>
      <span 
        className="info-icon"
        onMouseEnter={() => setHoveredIndicator(indicator)}
        onMouseLeave={() => setHoveredIndicator(null)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
          marginLeft: '6px',
          backgroundColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
          borderRadius: '50%',
          cursor: 'help',
          fontSize: '11px',
          fontWeight: 'bold',
          color: theme === 'dark' ? '#d1d5db' : '#6b7280',
          position: 'relative',
        }}
      >
        i
        {hoveredIndicator === indicator && (
          <div
            className="tooltip"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              padding: '8px 12px',
              backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(31, 41, 55, 0.95)',
              color: theme === 'dark' ? '#f1f5f9' : 'white',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.4',
              width: '280px',
              textAlign: 'left',
              zIndex: 1000,
              boxShadow: theme === 'dark' ? '0 4px 6px rgba(0, 0, 0, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.2)',
              fontWeight: 'normal',
            }}
          >
            {indicatorDescriptions[indicator]}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: theme === 'dark' 
                  ? '6px solid rgba(15, 23, 42, 0.95)' 
                  : '6px solid rgba(31, 41, 55, 0.95)',
              }}
            />
          </div>
        )}
      </span>
    </div>
  );

  // Filter data based on time interval
  const filterDataByInterval = () => {
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeInterval) {
      case '1d':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default: // 'all'
        return {
          dates: chartData.dates,
          ohlc: chartData.ohlc,
          volume: chartData.volume,
          indicators: chartData.indicators,
        };
    }

    // Find the index where dates are after cutoff
    const startIndex = chartData.dates.findIndex(dateStr => 
      new Date(dateStr) >= cutoffDate
    );

    if (startIndex === -1) {
      return chartData; // Return all data if no matching date found
    }

    // Slice all arrays from startIndex
    return {
      dates: chartData.dates.slice(startIndex),
      ohlc: {
        open: chartData.ohlc.open.slice(startIndex),
        high: chartData.ohlc.high.slice(startIndex),
        low: chartData.ohlc.low.slice(startIndex),
        close: chartData.ohlc.close.slice(startIndex),
      },
      volume: chartData.volume.slice(startIndex),
      indicators: {
        sma20: chartData.indicators.sma20?.slice(startIndex),
        sma50: chartData.indicators.sma50?.slice(startIndex),
        sma200: chartData.indicators.sma200?.slice(startIndex),
        rsi: chartData.indicators.rsi?.slice(startIndex),
        macd: chartData.indicators.macd?.slice(startIndex),
        macdSignal: chartData.indicators.macdSignal?.slice(startIndex),
        macdHist: chartData.indicators.macdHist?.slice(startIndex),
        sma150: chartData.indicators.sma150?.slice(startIndex),
        cci: chartData.indicators.cci?.slice(startIndex),
        bbUpper: chartData.indicators.bbUpper?.slice(startIndex),
        bbLower: chartData.indicators.bbLower?.slice(startIndex),
      },
    };
  };

  const filteredData = filterDataByInterval();

  // Prepare candlestick data in the format required by chartjs-chart-financial
  const candlestickData = filteredData.dates.map((date, index) => ({
    x: new Date(date).getTime(),
    o: filteredData.ohlc.open[index],
    h: filteredData.ohlc.high[index],
    l: filteredData.ohlc.low[index],
    c: filteredData.ohlc.close[index],
  }));
  
  // Add description for Demark indicator
  indicatorDescriptions['Demark'] = 'Demark Indicator identifies potential price exhaustion points. The indicator counts consecutive bars where the close price meets specific criteria. A completed 9-count setup signals a potential reversal. Green triangles indicate buy signals (potential bottom), red triangles indicate sell signals (potential top).';

  // Price chart data
  const priceData = {
    datasets: chartType === 'line' ? [
      {
        label: 'Close Price',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.ohlc.close[index],
        })),
        borderColor: theme === 'dark' ? 'rgb(56, 189, 248)' : 'rgb(14, 165, 233)',
        backgroundColor: theme === 'dark' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      },
      ...(filteredData.indicators.sma20 ? [{
        label: 'SMA 20',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma20![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.sma50 ? [{
        label: 'SMA 50',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma50![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.sma150 ? [{
        label: 'SMA 150',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma150![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.sma200 ? [{
        label: 'SMA 200',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma200![index],
        })),
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
    ] : [
      {
        label: ticker,
        data: candlestickData,
        type: 'candlestick' as const,
        color: {
          up: chartTheme.upColor,
          down: chartTheme.downColor,
          unchanged: '#999',
        },
        borderColor: {
          up: '#26a69a',
          down: '#ef5350',
          unchanged: '#999',
        },
        backgroundColors: {
          up: '#26a69a',
          down: '#ef5350',
          unchanged: '#999',
        },
      },
      ...(filteredData.indicators.sma20 ? [{
        label: 'SMA 20',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma20![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.sma50 ? [{
        label: 'SMA 50',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma50![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.sma150 ? [{
        label: 'SMA 150',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma150![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      }] : []),
    ],
  };

  // Volume chart data
  const volumeData = {
    labels: filteredData.dates,
    datasets: [
      {
        label: 'Volume',
        data: filteredData.volume,
        backgroundColor: filteredData.ohlc.close.map((close, index) => {
          if (index === 0) return theme === 'dark' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(14, 165, 233, 0.5)';
          return close >= filteredData.ohlc.close[index - 1] 
            ? theme === 'dark' ? 'rgba(134, 239, 172, 0.5)' : 'rgba(34, 197, 94, 0.5)'
            : theme === 'dark' ? 'rgba(252, 165, 165, 0.5)' : 'rgba(239, 68, 68, 0.5)';
        }),
        borderColor: filteredData.ohlc.close.map((close, index) => {
          if (index === 0) return theme === 'dark' ? 'rgba(56, 189, 248, 1)' : 'rgba(14, 165, 233, 1)';
          return close >= filteredData.ohlc.close[index - 1] 
            ? theme === 'dark' ? 'rgba(134, 239, 172, 1)' : 'rgba(34, 197, 94, 1)'
            : theme === 'dark' ? 'rgba(252, 165, 165, 1)' : 'rgba(239, 68, 68, 1)';
        }),
        borderWidth: 1,
        type: 'bar' as const,
      },
    ],
  };

  // RSI chart data
  const rsiData = {
    labels: filteredData.dates,
    datasets: filteredData.indicators.rsi ? [
      {
        label: 'RSI',
        data: filteredData.indicators.rsi,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      },
      {
        label: 'Overbought',
        data: new Array(filteredData.dates.length).fill(70),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line' as const,
      },
      {
        label: 'Oversold',
        data: new Array(filteredData.dates.length).fill(30),
        borderColor: 'rgba(75, 192, 192, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line' as const,
      },
    ] : [],
  };

  // MACD chart data
  const macdData = {
    labels: filteredData.dates,
    datasets: [
      ...(filteredData.indicators.macd ? [{
        label: 'MACD',
        data: filteredData.indicators.macd,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.macdSignal ? [{
        label: 'Signal',
        data: filteredData.indicators.macdSignal,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      }] : []),
      ...(filteredData.indicators.macdHist ? [{
        label: 'Histogram',
        data: filteredData.indicators.macdHist,
        backgroundColor: filteredData.indicators.macdHist.map(value => 
          value >= 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'
        ),
        borderColor: filteredData.indicators.macdHist.map(value => 
          value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
        ),
        borderWidth: 1,
        type: 'bar' as const,
      }] : []),
    ],
  };

  // CCI chart data
  const cciData = {
    labels: filteredData.dates,
    datasets: filteredData.indicators.cci ? [
      {
        label: 'CCI',
        data: filteredData.indicators.cci,
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      },
      {
        label: 'Overbought',
        data: new Array(filteredData.dates.length).fill(100),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line' as const,
      },
      {
        label: 'Oversold',
        data: new Array(filteredData.dates.length).fill(-100),
        borderColor: 'rgba(75, 192, 192, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line' as const,
      },
      {
        label: 'Zero Line',
        data: new Array(filteredData.dates.length).fill(0),
        borderColor: 'rgba(156, 163, 175, 0.5)',
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        type: 'line' as const,
      },
    ] : [],
  };

  // Bollinger Bands chart data
  const bollingerData = {
    labels: filteredData.dates,
    datasets: (filteredData.indicators.bbUpper && filteredData.indicators.bbLower) ? [
      {
        label: 'Upper Band',
        data: filteredData.indicators.bbUpper,
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
        fill: '+1',
      },
      {
        label: 'Lower Band',
        data: filteredData.indicators.bbLower,
        borderColor: 'rgba(54, 162, 235, 0.8)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
        fill: '-1',
      },
      {
        label: 'Close Price',
        data: filteredData.ohlc.close,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
        fill: false,
      },
      {
        label: 'Middle Band (SMA 20)',
        data: filteredData.indicators.sma20 || new Array(filteredData.dates.length).fill(null),
        borderColor: 'rgba(255, 159, 64, 0.8)',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
        fill: false,
      },
    ] : [],
  };

  // Support & Resistance chart data
  const supportResistanceData = {
    datasets: [
      {
        label: ticker,
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          o: filteredData.ohlc.open[index],
          h: filteredData.ohlc.high[index],
          l: filteredData.ohlc.low[index],
          c: filteredData.ohlc.close[index],
        })),
        type: 'candlestick' as const,
        candlestick: {
          color: {
            up: '#26a69a',
            down: '#ef5350',
            unchanged: '#999',
          },
        },
      } as any,
      ...supportResistanceLevels.map((level) => ({
        label: `${level.type} ($${level.price.toFixed(2)})`,
        data: filteredData.dates.map((date) => ({
          x: new Date(date).getTime(),
          y: level.price,
        })),
        borderColor: level.type === 'Support' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        type: 'line' as const,
        fill: false,
      })),
    ],
  };

  // Process Demark Indicator Signals
  const demarkSignals = filteredData.indicators.demarkBuySignals || filteredData.indicators.demarkSellSignals ?
    processDemarkSignals(
      filteredData.indicators.demarkBuySignals,
      filteredData.indicators.demarkSellSignals,
      filteredData.dates,
      filteredData.ohlc.close
    ) : { buyPoints: [], sellPoints: [] };

  // Add Demark signals to chart data after processing
  // We no longer need this code block as Demark signals are now added directly in the dedicated chart
  // Removing reference to non-existent mainChartData

  // Demark chart options
  const demarkChartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd',
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          color: chartTheme.textColor,
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: chartTheme.gridColor,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          },
          color: chartTheme.textColor,
        },
        title: {
          display: true,
          text: 'Price ($)',
          color: chartTheme.textColor,
        },
      },
    },
  };

  // Support & Resistance chart options
  const supportResistanceOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const raw = context.raw;
            
            if (raw && raw.o !== undefined) {
              return [
                `Open: $${raw.o.toFixed(2)}`,
                `High: $${raw.h.toFixed(2)}`,
                `Low: $${raw.l.toFixed(2)}`,
                `Close: $${raw.c.toFixed(2)}`,
              ];
            }
            
            if (label.includes('Support') || label.includes('Resistance')) {
              return `${label} (Strength: ${supportResistanceLevels[context.datasetIndex - 1]?.strength.toFixed(1)}%)`;
            }

            if (label === 'Demark Buy Signal' || label === 'Demark Sell Signal') {
              return label;
            }
            
            return '';
          },
        },
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: chartTheme.textColor,
        },
        ticks: {
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price ($)',
          color: chartTheme.textColor,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          },
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
    },
  };

  // Price chart options
  const priceOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        callbacks: chartType === 'candlestick' ? {
          label: function(context: any) {
            const raw = context.raw;
            if (raw && raw.o !== undefined) {
              return [
                `Open: $${raw.o.toFixed(2)}`,
                `High: $${raw.h.toFixed(2)}`,
                `Low: $${raw.l.toFixed(2)}`,
                `Close: $${raw.c.toFixed(2)}`,
              ];
            }
            if (context.dataset.type === 'line') {
              return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
            }
            return '';
          },
        } : undefined,
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Date',
          color: chartTheme.textColor,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        offset: true,
        padding: {
          left: 10,
          right: 30
        }
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price ($)',
          color: chartTheme.textColor,
        },
        ticks: {
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        beginAtZero: false,
        grace: '5%',
      },
    },
    layout: {
      padding: {
        right: 30
      }
    },
  };

  // Volume chart options
  const volumeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = 'Volume: ';
            if (context.parsed.y !== null) {
              label += (context.parsed.y / 1e6).toFixed(2) + 'M';
            }
            return label;
          },
        },
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: chartTheme.textColor,
        },
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Volume',
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        ticks: {
          callback: function(value: any) {
            return (Number(value) / 1e6).toFixed(0) + 'M';
          },
          color: chartTheme.textColor,
        },
        beginAtZero: true,
        grace: '5%',
      },
    },
  };

  // RSI chart options
  const rsiOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
        color: chartTheme.textColor,
      },
      legend: {
        display: false,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'RSI') {
              return 'RSI: ' + context.parsed.y.toFixed(2);
            }
            return '';
          },
        },
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'RSI',
          color: chartTheme.textColor,
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value;
          },
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        grace: '5%',
      },
    },
  };

  // MACD chart options
  const macdOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
        color: chartTheme.textColor,
      },
      legend: {
        position: 'top' as const,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'MACD',
          color: chartTheme.textColor,
        },
        ticks: {
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        grace: '5%',
      },
    },
  };

  // CCI chart options
  const cciOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
        color: chartTheme.textColor,
      },
      legend: {
        display: false,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            if (context.dataset.label === 'CCI') {
              return 'CCI: ' + context.parsed.y.toFixed(2);
            }
            return '';
          },
        },
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'CCI',
          color: chartTheme.textColor,
        },
        min: -200,
        max: 200,
        ticks: {
          callback: function(value: any) {
            return value;
          },
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
        grace: '5%',
      },
    },
  };

  // Bollinger Bands chart options
  const bollingerOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: false,
        color: chartTheme.textColor,
      },
      legend: {
        position: 'top' as const,
        display: true,
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value !== null) {
              return `${label}: $${value.toFixed(2)}`;
            }
            return '';
          },
        },
        backgroundColor: chartTheme.tooltipBackgroundColor,
        titleColor: chartTheme.tooltipTextColor,
        bodyColor: chartTheme.tooltipTextColor,
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price ($)',
          color: chartTheme.textColor,
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          },
          color: chartTheme.textColor,
        },
        grid: {
          display: true,
          color: chartTheme.gridColor,
        },
      },
    },
  };

  // CSS styles for chart components
  const expandButtonStyle = {
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '4px 12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6b7280',
    transition: 'all 0.2s ease',
  };

  const expandButtonHoverStyle = {
    ...expandButtonStyle,
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  };

  // Function to render chart headers (without hooks)
  const renderChartHeader = (title: string, chartId: string) => {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 600, 
          margin: 0,
          color: '#374151'
        }}>{title}</h3>
        
        <button
          onClick={() => setFullScreenChart(chartId)}
          className="expand-button"
          aria-label={`Expand ${title} to fullscreen`}
          title={`View ${title} in fullscreen mode`}
          style={expandButtonStyle}
        >
          <span style={{ marginRight: '4px' }}>⛶</span> Expand
        </button>
      </div>
    );
  };

  return (
    <div className="charts-container">
      <style>
        {`
          .chart-container:active {
            cursor: grabbing !important;
          }
          .expand-button:hover, .expand-button:focus {
            background-color: #f9fafb !important;
            border-color: #d1d5db !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
          }
        `}
      </style>
      <div className="chart-controls" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '0.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
      }}>
        <div className="chart-type-selector" style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
        }}>
          <button 
            className={`chart-type-button ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line
          </button>
          <button 
            className={`chart-type-button ${chartType === 'candlestick' ? 'active' : ''}`}
            onClick={() => setChartType('candlestick')}
          >
            Candlestick
          </button>
        </div>
        <div className="time-interval-selector" style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
        }}>
          <button 
            className={`time-interval-button ${timeInterval === '1d' ? 'active' : ''}`}
            onClick={() => setTimeInterval('1d')}
          >
            1D
          </button>
          <button 
            className={`time-interval-button ${timeInterval === 'week' ? 'active' : ''}`}
            onClick={() => setTimeInterval('week')}
          >
            1W
          </button>
          <button 
            className={`time-interval-button ${timeInterval === 'month' ? 'active' : ''}`}
            onClick={() => setTimeInterval('month')}
          >
            1M
          </button>
          <button 
            className={`time-interval-button ${timeInterval === 'year' ? 'active' : ''}`}
            onClick={() => setTimeInterval('year')}
          >
            1Y
          </button>
          <button 
            className={`time-interval-button ${timeInterval === 'all' ? 'active' : ''}`}
            onClick={() => setTimeInterval('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
        {renderChartHeader(`${ticker} - Stock Price`, 'price')}
        <div className="chart-container" 
          style={{ 
            height: '400px',
            ...chartContainerStyle,
            cursor: 'grab',
          }}>
          <Chart 
            type={chartType === 'line' ? 'line' : 'candlestick' as any} 
            data={priceData} 
            options={{
              ...priceOptions,
              onHover: (event: any, elements: any) => {
                const target = event.native?.target as HTMLElement;
                if (target) {
                  target.style.cursor = elements?.length ? 'pointer' : 'grab';
                }
              },
            }} 
          />
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
        {renderChartHeader(`${ticker} - Volume`, 'volume')}
        <div className="chart-container" 
          style={{ 
            height: '200px',
            ...chartContainerStyle,
            cursor: 'grab',
          }}>
          <Chart 
            type='bar' 
            data={volumeData} 
            options={{
              ...volumeOptions,
              onHover: (event: any, elements: any) => {
                const target = event.native?.target as HTMLElement;
                if (target) {
                  target.style.cursor = elements?.length ? 'pointer' : 'grab';
                }
              },
            }} 
          />
        </div>
      </div>
      {/* RSI Chart */}
      {filteredData.indicators.rsi && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          {renderChartHeader(`${ticker} - RSI (Relative Strength Index)`, 'rsi')}
          <div className="chart-container" style={{ height: '200px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart 
              type='line' 
              data={rsiData} 
              options={{
                ...rsiOptions,
                onHover: (event: any, elements: any) => {
                  const target = event.native?.target as HTMLElement;
                  if (target) {
                    target.style.cursor = elements?.length ? 'pointer' : 'grab';
                  }
                },
              }} 
            />
          </div>
        </div>
      )}
      
      {/* MACD Chart */}
      {(filteredData.indicators.macd || filteredData.indicators.macdSignal) && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          {renderChartHeader(`${ticker} - MACD (Moving Average Convergence Divergence)`, 'macd')}
          <div className="chart-container" style={{ height: '200px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart type='bar' data={macdData} options={macdOptions} />
          </div>
        </div>
      )}
      
      {/* CCI Chart */}
      {filteredData.indicators.cci && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          {renderChartHeader(`${ticker} - CCI (Commodity Channel Index)`, 'cci')}
          <div className="chart-container" style={{ height: '200px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart type='line' data={cciData} options={cciOptions} />
          </div>
        </div>
      )}
      
      {/* Bollinger Bands */}
      {filteredData.indicators.bbUpper && filteredData.indicators.bbLower && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          {renderChartHeader(`${ticker} - Bollinger Bands`, 'bollinger')}
          <div className="chart-container" style={{ height: '300px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart type='line' data={bollingerData} options={bollingerOptions} />
          </div>
        </div>
      )}
      
      {/* Demark Indicator Chart */}
      {((filteredData.indicators.demarkBuySignals && filteredData.indicators.demarkBuySignals.length > 0) || (filteredData.indicators.demarkSellSignals && filteredData.indicators.demarkSellSignals.length > 0)) && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              margin: 0,
              color: '#374151'
            }}>{ticker} - Demark Indicator Buy/Sell Signals</h3>
            
            <button
              onClick={() => setFullScreenChart('demark')}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '4px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              <span style={{ marginRight: '4px' }}>⛶</span> Expand
            </button>
          </div>
          <div className="chart-container" style={{ height: '400px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart 
              type='candlestick'
              data={{
                datasets: [
                  {
                    label: 'Price',
                    data: candlestickData,
                    type: 'candlestick' as const,
                    candlestick: {
                      color: {
                        up: '#26a69a',
                        down: '#ef5350',
                        unchanged: '#999',
                      },
                    },
                  } as any,
                  ...(demarkSignals.buyPoints.length > 0 ? [{
                    label: 'Demark Buy Signal',
                    data: demarkSignals.buyPoints,
                    backgroundColor: 'rgba(52, 211, 153, 1)',
                    borderColor: 'rgba(52, 211, 153, 1)',
                    pointStyle: 'triangle',
                    pointRadius: 10,
                    pointHoverRadius: 15,
                    showLine: false,
                    type: 'scatter' as const,
                  }] : []),
                  ...(demarkSignals.sellPoints.length > 0 ? [{
                    label: 'Demark Sell Signal',
                    data: demarkSignals.sellPoints,
                    backgroundColor: 'rgba(239, 68, 68, 1)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    pointStyle: 'triangle',
                    rotation: 180,
                    pointRadius: 10,
                    pointHoverRadius: 15,
                    showLine: false,
                    type: 'scatter' as const,
                  }] : [])
                ]
              }}
              options={{
                ...demarkChartOptions,
                plugins: {
                  ...demarkChartOptions.plugins,
                  title: {
                    display: false,
                    text: 'Demark Indicator Buy/Sell Signals',
                    font: {
                      size: 16,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context: any) {
                        const label = context.dataset.label || '';
                        const raw = context.raw;
                        
                        if (raw && raw.o !== undefined) {
                          return [
                            `Open: $${raw.o.toFixed(2)}`,
                            `High: $${raw.h.toFixed(2)}`,
                            `Low: $${raw.l.toFixed(2)}`,
                            `Close: $${raw.c.toFixed(2)}`,
                          ];
                        }
                        
                        if (label === 'Demark Buy Signal') {
                          return 'Potential buy point (price exhaustion)';
                        }
                        
                        if (label === 'Demark Sell Signal') {
                          return 'Potential sell point (price exhaustion)';
                        }
                        
                        return '';
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
      {/* Support & Resistance Levels */}
      {supportResistanceLevels.length > 0 && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              margin: 0,
              color: '#374151'
            }}>{ticker} - Support & Resistance Levels</h3>
            
            <button
              onClick={() => setFullScreenChart('support-resistance')}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '4px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              <span style={{ marginRight: '4px' }}>⛶</span> Expand
            </button>
          </div>
          <div className="chart-container" style={{ height: '300px', ...chartContainerStyle, cursor: 'grab' }}>
            <Chart type='candlestick' data={supportResistanceData} options={supportResistanceOptions} />
          </div>
        </div>
      )}

      {/* Fullscreen Chart Components */}
      <FullScreenModal 
        isOpen={fullScreenChart === 'price'}
        title={`${ticker} - Stock Price (${chartType === 'line' ? 'Line' : 'Candlestick'})`}
        onClose={() => setFullScreenChart(null)}
      >
        <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
          <Chart 
            type={chartType === 'line' ? 'line' : 'candlestick' as any}
            data={priceData}
            options={{
              ...priceOptions,
              onHover: (event: any, elements: any) => {
                const target = event.native?.target as HTMLElement;
                if (target) {
                  target.style.cursor = elements?.length ? 'pointer' : 'grab';
                }
              },
            }}
          />
        </div>
      </FullScreenModal>

      <FullScreenModal 
        isOpen={fullScreenChart === 'volume'}
        title={`${ticker} - Trading Volume`}
        onClose={() => setFullScreenChart(null)}
      >
        <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
          <Chart 
            type='bar'
            data={volumeData}
            options={volumeOptions}
          />
        </div>
      </FullScreenModal>

      {filteredData.indicators.rsi && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'rsi'}
          title={`${ticker} - RSI (Relative Strength Index`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='line'
              data={rsiData}
              options={rsiOptions}
            />
          </div>
        </FullScreenModal>
      )}

      {(filteredData.indicators.macd || filteredData.indicators.macdSignal) && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'macd'}
          title={`${ticker} - MACD (Moving Average Convergence Divergence)`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='bar'
              data={macdData}
              options={macdOptions}
            />
          </div>
        </FullScreenModal>
      )}

      {filteredData.indicators.cci && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'cci'}
          title={`${ticker} - CCI (Commodity Channel Index)`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='line'
              data={cciData}
              options={cciOptions}
            />
          </div>
        </FullScreenModal>
      )}

      {filteredData.indicators.bbUpper && filteredData.indicators.bbLower && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'bollinger'}
          title={`${ticker} - Bollinger Bands`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='line'
              data={bollingerData}
              options={bollingerOptions}
            />
          </div>
        </FullScreenModal>
      )}

      {((filteredData.indicators.demarkBuySignals && filteredData.indicators.demarkBuySignals.length > 0) || 
        (filteredData.indicators.demarkSellSignals && filteredData.indicators.demarkSellSignals.length > 0)) && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'demark'}
          title={`${ticker} - Demark Indicator Buy/Sell Signals`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='candlestick'
              data={{
                datasets: [
                  {
                    label: 'Price',
                    data: candlestickData,
                    type: 'candlestick' as const,
                    candlestick: {
                      color: {
                        up: '#26a69a',
                        down: '#ef5350',
                        unchanged: '#999',
                      },
                    },
                  } as any,
                  ...(demarkSignals.buyPoints.length > 0 ? [{
                    label: 'Demark Buy Signal',
                    data: demarkSignals.buyPoints,
                    backgroundColor: 'rgba(52, 211, 153, 1)',
                    borderColor: 'rgba(52, 211, 153, 1)',
                    pointStyle: 'triangle',
                    pointRadius: 10,
                    pointHoverRadius: 15,
                    showLine: false,
                    type: 'scatter' as const,
                  }] : []),
                  ...(demarkSignals.sellPoints.length > 0 ? [{
                    label: 'Demark Sell Signal',
                    data: demarkSignals.sellPoints,
                    backgroundColor: 'rgba(239, 68, 68, 1)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    pointStyle: 'triangle',
                    rotation: 180,
                    pointRadius: 10,
                    pointHoverRadius: 15,
                    showLine: false,
                    type: 'scatter' as const,
                  }] : [])
                ]
              }}
              options={demarkChartOptions}
            />
          </div>
        </FullScreenModal>
      )}

      {supportResistanceLevels.length > 0 && (
        <FullScreenModal 
          isOpen={fullScreenChart === 'support-resistance'}
          title={`${ticker} - Support & Resistance Levels`}
          onClose={() => setFullScreenChart(null)}
        >
          <div className="chart-container" style={{ height: 'calc(100vh - 120px)', ...chartContainerStyle }}>
            <Chart 
              type='candlestick'
              data={supportResistanceData}
              options={supportResistanceOptions}
            />
          </div>
        </FullScreenModal>
      )}
    </div>
  );
};

export default StockChart;