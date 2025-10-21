/**
 * HealthMetrics Component
 * Display health metrics with charts and statistics
 */

'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Activity, Heart, Droplet, Weight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import clsx from 'clsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HealthMetric {
  label: string;
  value: string;
  unit: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface HealthMetricsProps {
  className?: string;
}

export function HealthMetrics({ className }: HealthMetricsProps) {
  const metrics: HealthMetric[] = [
    {
      label: 'Fréquence cardiaque',
      value: '72',
      unit: 'bpm',
      change: -2,
      icon: <Heart className="h-5 w-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Tension artérielle',
      value: '120/80',
      unit: 'mmHg',
      change: 0,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100 dark:bg-primary-900/30',
    },
    {
      label: 'Glycémie',
      value: '95',
      unit: 'mg/dL',
      change: 3,
      icon: <Droplet className="h-5 w-5" />,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100 dark:bg-secondary-900/30',
    },
    {
      label: 'Poids',
      value: '68',
      unit: 'kg',
      change: -1,
      icon: <Weight className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  // Chart data for heart rate over the last 7 days
  const chartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    datasets: [
      {
        label: 'Fréquence cardiaque',
        data: [75, 73, 72, 74, 71, 72, 72],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
      {
        label: 'Tension systolique',
        data: [122, 120, 118, 121, 119, 120, 120],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card
            key={index}
            className="border-2 border-neutral-100 dark:border-neutral-700 hover:shadow-lg transition-all"
            padding="sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={clsx('p-2 rounded-lg', metric.bgColor, metric.color)}>
                    {metric.icon}
                  </div>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  {metric.label}
                </p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                    {metric.value}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {metric.unit}
                  </span>
                </div>
              </div>
              {metric.change !== undefined && (
                <div
                  className={clsx(
                    'text-xs font-semibold px-2 py-1 rounded-full',
                    metric.change > 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : metric.change < 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                  )}
                >
                  {metric.change > 0 ? '+' : ''}
                  {metric.change}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-2 border-neutral-100 dark:border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <span>Évolution de vos métriques</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
