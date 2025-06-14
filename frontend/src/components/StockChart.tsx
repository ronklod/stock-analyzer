import React, { useState } from 'react';
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
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ChartData, SupportResistanceLevel } from '../types';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';

// Register all required components
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

// Add CSS at the top of the file
const chartContainerStyle = {
  cursor: 'grab',
} as const;

const StockChart: React.FC<Props> = ({ chartData, ticker, supportResistanceLevels }) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('all');
  const [hoveredIndicator, setHoveredIndicator] = useState<string | null>(null);

  const indicatorDescriptions: Record<string, string> = {
    'RSI': 'Relative Strength Index (RSI) measures momentum. Values above 70 indicate overbought conditions (potential price drop), while values below 30 indicate oversold conditions (potential price rise). The RSI helps identify potential reversal points.',
    'MACD': 'Moving Average Convergence Divergence (MACD) identifies trend changes. When the MACD line (blue) crosses above the signal line (red), it\'s a bullish signal. When it crosses below, it\'s bearish. The histogram shows the difference between these lines.',
    'CCI': 'Commodity Channel Index (CCI) identifies cyclical trends. Values above +100 indicate overbought conditions, while values below -100 indicate oversold conditions. CCI helps identify trend reversals and extreme market conditions.',
    'Bollinger': 'Bollinger Bands measure volatility using standard deviations. When bands narrow, it indicates low volatility (squeeze). When price touches the upper band, it may be overbought; touching the lower band may indicate oversold conditions. The middle band is a 20-day moving average.'
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
        color: '#374151'
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
          backgroundColor: '#e5e7eb',
          borderRadius: '50%',
          cursor: 'help',
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#6b7280',
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
              backgroundColor: 'rgba(31, 41, 55, 0.95)',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.4',
              width: '280px',
              textAlign: 'left',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
                borderTop: '6px solid rgba(31, 41, 55, 0.95)',
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

  // Price chart data
  const priceData = {
    datasets: chartType === 'line' ? [
      {
        label: 'Close Price',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.ohlc.close[index],
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma20 && {
        label: 'SMA 20',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma20![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma50 && {
        label: 'SMA 50',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma50![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma150 && {
        label: 'SMA 150',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma150![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma200 && {
        label: 'SMA 200',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma200![index],
        })),
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
        pointRadius: 0,
        type: 'line' as const,
      },
    ].filter(Boolean) : [
      {
        label: ticker,
        data: candlestickData,
        type: 'candlestick' as const,
        color: {
          up: '#26a69a',
          down: '#ef5350',
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
      filteredData.indicators.sma20 && {
        label: 'SMA 20',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma20![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma50 && {
        label: 'SMA 50',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma50![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      },
      filteredData.indicators.sma150 && {
        label: 'SMA 150',
        data: filteredData.dates.map((date, index) => ({
          x: new Date(date).getTime(),
          y: filteredData.indicators.sma150![index] || null,
        })).filter(point => point.y !== null),
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        pointRadius: 0,
        type: 'line' as const,
      },
    ].filter(Boolean) as any[],
  };

  // Volume chart data
  const volumeData = {
    labels: filteredData.dates,
    datasets: [
      {
        label: 'Volume',
        data: filteredData.volume,
        backgroundColor: filteredData.ohlc.close.map((close, index) => {
          if (index === 0) return 'rgba(75, 192, 192, 0.5)';
          return close >= filteredData.ohlc.close[index - 1] 
            ? 'rgba(75, 192, 192, 0.5)' 
            : 'rgba(255, 99, 132, 0.5)';
        }),
        borderColor: filteredData.ohlc.close.map((close, index) => {
          if (index === 0) return 'rgba(75, 192, 192, 1)';
          return close >= filteredData.ohlc.close[index - 1] 
            ? 'rgba(75, 192, 192, 1)' 
            : 'rgba(255, 99, 132, 1)';
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
      filteredData.indicators.macd && {
        label: 'MACD',
        data: filteredData.indicators.macd,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      },
      filteredData.indicators.macdSignal && {
        label: 'Signal',
        data: filteredData.indicators.macdSignal,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        type: 'line' as const,
      },
      filteredData.indicators.macdHist && {
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
      },
    ].filter(Boolean) as any[],
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
        display: true,
        text: 'Support & Resistance Levels',
        font: {
          size: 16,
        },
      },
      legend: {
        position: 'top' as const,
        display: true,
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
            
            return '';
          },
        },
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
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price ($)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          },
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
        display: true,
        text: `${ticker} Stock Price`,
        font: {
          size: 18,
        },
      },
      legend: {
        position: 'top' as const,
        display: true,
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
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          display: true,
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
        },
        grid: {
          display: true,
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
        display: true,
        text: `${ticker} Trading Volume`,
        font: {
          size: 18,
        },
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
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
        },
        grid: {
          display: true,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Volume',
        },
        grid: {
          display: true,
        },
        ticks: {
          callback: function(value: any) {
            return (Number(value) / 1e6).toFixed(0) + 'M';
          },
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
      },
      legend: {
        display: false,
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
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
        },
        grid: {
          display: true,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'RSI',
        },
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value;
          },
        },
        grid: {
          display: true,
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
      },
      legend: {
        position: 'top' as const,
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
        },
        grid: {
          display: true,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'MACD',
        },
        grid: {
          display: true,
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
      },
      legend: {
        display: false,
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
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
        },
        grid: {
          display: true,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'CCI',
        },
        min: -200,
        max: 200,
        ticks: {
          callback: function(value: any) {
            return value;
          },
        },
        grid: {
          display: true,
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
      },
      legend: {
        position: 'top' as const,
        display: true,
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
      },
      zoom: zoomOptions as any,
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
          autoSkip: true,
        },
      },
      y: {
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price ($)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(0);
          },
        },
      },
    },
  };

  return (
    <div className="charts-container">
      <style>
        {`
          .chart-container:active {
            cursor: grabbing !important;
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
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
        }}>
          <button 
            className={`chart-type-button`}
            onClick={() => setChartType('line')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: chartType === 'line' ? '#fff' : 'transparent',
              color: chartType === 'line' ? '#1a73e8' : '#4b5563',
              boxShadow: chartType === 'line' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Line
          </button>
          <button 
            className={`chart-type-button`}
            onClick={() => setChartType('candlestick')}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: chartType === 'candlestick' ? '#fff' : 'transparent',
              color: chartType === 'candlestick' ? '#1a73e8' : '#4b5563',
              boxShadow: chartType === 'candlestick' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Candlestick
          </button>
        </div>
        <div className="time-interval-selector" style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.25rem',
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
        }}>
          <button 
            className={`time-interval-button`}
            onClick={() => setTimeInterval('1d')}
            style={{
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: timeInterval === '1d' ? '#fff' : 'transparent',
              color: timeInterval === '1d' ? '#1a73e8' : '#4b5563',
              boxShadow: timeInterval === '1d' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            1D
          </button>
          <button 
            className={`time-interval-button`}
            onClick={() => setTimeInterval('week')}
            style={{
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: timeInterval === 'week' ? '#fff' : 'transparent',
              color: timeInterval === 'week' ? '#1a73e8' : '#4b5563',
              boxShadow: timeInterval === 'week' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            1W
          </button>
          <button 
            className={`time-interval-button`}
            onClick={() => setTimeInterval('month')}
            style={{
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: timeInterval === 'month' ? '#fff' : 'transparent',
              color: timeInterval === 'month' ? '#1a73e8' : '#4b5563',
              boxShadow: timeInterval === 'month' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            1M
          </button>
          <button 
            className={`time-interval-button`}
            onClick={() => setTimeInterval('year')}
            style={{
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: timeInterval === 'year' ? '#fff' : 'transparent',
              color: timeInterval === 'year' ? '#1a73e8' : '#4b5563',
              boxShadow: timeInterval === 'year' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            1Y
          </button>
          <button 
            className={`time-interval-button`}
            onClick={() => setTimeInterval('all')}
            style={{
              padding: '0.5rem 0.75rem',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: timeInterval === 'all' ? '#fff' : 'transparent',
              color: timeInterval === 'all' ? '#1a73e8' : '#4b5563',
              boxShadow: timeInterval === 'all' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            ALL
          </button>
        </div>
      </div>
      <div className="zoom-instructions">
        <small>
          💡 Scroll to zoom X & Y axes • Click and drag to move chart • 
          Double-click to reset
        </small>
      </div>
      <div className="chart-wrapper">
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
      {filteredData.indicators.rsi && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <ChartHeader title="RSI (Relative Strength Index)" indicator="RSI" />
          <div className="chart-container" 
            style={{ 
              height: '200px',
              ...chartContainerStyle,
              cursor: 'grab',
            }}>
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
      {(filteredData.indicators.macd || filteredData.indicators.macdSignal) && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <ChartHeader title="MACD (Moving Average Convergence Divergence)" indicator="MACD" />
          <div className="chart-container" style={{ height: '200px' }}>
            <Chart type='bar' data={macdData} options={macdOptions} />
          </div>
        </div>
      )}
      {filteredData.indicators.cci && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <ChartHeader title="CCI (Commodity Channel Index)" indicator="CCI" />
          <div className="chart-container" style={{ height: '200px' }}>
            <Chart type='line' data={cciData} options={cciOptions} />
          </div>
        </div>
      )}
      {filteredData.indicators.bbUpper && filteredData.indicators.bbLower && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <ChartHeader title="Bollinger Bands" indicator="Bollinger" />
          <div className="chart-container" style={{ height: '300px' }}>
            <Chart type='line' data={bollingerData} options={bollingerOptions} />
          </div>
        </div>
      )}
      {supportResistanceLevels.length > 0 && (
        <div className="chart-wrapper" style={{ marginTop: '2rem' }}>
          <ChartHeader title="Support & Resistance Levels" indicator="Support & Resistance" />
          <div className="chart-container" style={{ height: '300px' }}>
            <Chart type='candlestick' data={supportResistanceData} options={supportResistanceOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockChart; 