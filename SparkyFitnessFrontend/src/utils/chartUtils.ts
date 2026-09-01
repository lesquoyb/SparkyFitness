/**
 * Chart utilities for improving readability
 * Implements auto-scaling y-axis with smart domain calculation
 * Addresses Issue #144: Improve plot readability
 */

export interface ChartDataPoint {
  [key: string]: number | string | boolean | null | undefined;
  date?: string;
  entry_date?: string;
}

/**
 * Calculate smart Y-axis domain for better chart readability
 * @param data Array of data points
 * @param dataKey The key to extract values from
 * @param options Configuration options
 * @returns [min, max] domain array or undefined for auto-scaling
 */
export function calculateSmartYAxisDomain(
  data: ChartDataPoint[],
  dataKey: string,
  options: {
    marginPercent?: number; // Default: 10% margin
    useZeroBaseline?: boolean; // Force zero baseline
    minRangeThreshold?: number; // If range is small relative to max, use zero baseline
    forceMin?: number; // Force a specific minimum value for the Y-axis
  } = {}
): [number, number] | [number, string] | undefined {
  const { marginPercent = 0.1, useZeroBaseline = false, forceMin } = options;

  if (!data || data.length === 0) {
    return undefined;
  }

  // Extract valid numeric values
  const values = data
    .map((item) => (typeof item[dataKey] === 'number' ? item[dataKey] : null))
    .filter((val): val is number => val !== null && !isNaN(val));

  if (values.length === 0) {
    return undefined;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  // If all values are the same, use a small range around the value
  if (range === 0) {
    const value = values[0];
    if (value) {
      return value === 0 ? [0, 1] : [value * 0.95, value * 1.05];
    }
  }

  // Use min-max with margin for better visibility of trends
  const margin = range * marginPercent;
  let domainMin = min - margin;
  const domainMax = max + margin;

  if (forceMin !== undefined) {
    domainMin = forceMin;
  } else if (useZeroBaseline) {
    domainMin = Math.min(0, domainMin); // Ensure it starts at 0 or below if useZeroBaseline is true
  } else {
    // If not using zero baseline, and min is positive, ensure domainMin doesn't go negative
    if (min >= 0 && domainMin < 0) {
      domainMin = 0;
    }
  }

  return [domainMin, domainMax];
}

/**
 * Filter out current incomplete day from nutrition data
 * @param data Array of nutrition data points
 * @param currentDate Current date string (YYYY-MM-DD)
 * @returns Filtered data array excluding current day
 */
export function excludeIncompleteDay<T extends ChartDataPoint>(
  data: T[],
  currentDate: string
): T[] {
  if (!data || data.length === 0) {
    return data;
  }

  const today = new Date(currentDate).toDateString();

  return data.filter((item) => {
    const itemDate = item.date || item.entry_date;
    if (!itemDate) return true;

    // Convert item date to same format for comparison
    const itemDateObj = new Date(itemDate);
    return itemDateObj.toDateString() !== today;
  });
}

/**
 * Check if data represents nutrition/calorie metrics that should exclude incomplete days
 * @param dataKey The metric key being displayed
 * @returns true if this metric should exclude incomplete days
 */
export function shouldExcludeIncompleteDay(dataKey: string): boolean {
  const nutritionMetrics = [
    'calories',
    'protein',
    'carbs',
    'fat',
    'saturated_fat',
    'polyunsaturated_fat',
    'monounsaturated_fat',
    'trans_fat',
    'cholesterol',
    'sodium',
    'potassium',
    'dietary_fiber',
    'sugars',
    'vitamin_a',
    'vitamin_c',
    'calcium',
    'iron',
  ];

  return nutritionMetrics.includes(dataKey.toLowerCase());
}

/**
 * Get chart configuration for different metric types
 * @param dataKey The metric key
 * @returns Configuration object with scaling preferences
 */
export function getChartConfig(dataKey: string) {
  const weightMetrics = [
    'weight',
    'neck',
    'waist',
    'hips',
    'height',
    'body_fat_percentage',
  ];
  const nutritionMetrics = ['calories', 'protein', 'carbs', 'fat'];
  const vitaminMetrics = ['vitamin_a', 'vitamin_c', 'calcium', 'iron'];

  if (weightMetrics.includes(dataKey.toLowerCase())) {
    return {
      useSmartScaling: true,
      excludeIncompleteDay: false,
      useZeroBaseline: false, // Explicitly set to false for weight charts
      marginPercent: 0.05, // Smaller margin for body measurements
      minRangeThreshold: 0.2, // More likely to use min-max scaling
      forceMin: undefined as unknown, // Will be set dynamically in MeasurementChartsGrid
    };
  }

  if (nutritionMetrics.includes(dataKey.toLowerCase())) {
    return {
      useSmartScaling: true,
      excludeIncompleteDay: false,
      marginPercent: 0.1,
      minRangeThreshold: 0.3,
    };
  }

  if (vitaminMetrics.includes(dataKey.toLowerCase())) {
    return {
      useSmartScaling: true,
      excludeIncompleteDay: false,
      marginPercent: 0.15, // Larger margin for micronutrients
      minRangeThreshold: 0.4,
    };
  }

  // Default configuration
  return {
    useSmartScaling: true,
    excludeIncompleteDay: false,
    marginPercent: 0.1,
    minRangeThreshold: 0.3,
  };
}

/**
 * Prepares chart data for time-based scaling by attaching a numeric `timestamp`
 * property (in milliseconds) and sorting entries chronologically.
 */
export function prepareTimeChartData<T extends ChartDataPoint>(
  data: T[],
  dateKey: keyof T | string = 'date'
): (T & { timestamp: number })[] {
  if (!data || data.length === 0) return [];

  const prepared = data
    .map((item) => {
      const rawDate = item[dateKey as keyof T];
      let timestamp = 0;
      if (typeof rawDate === 'number') {
        timestamp = rawDate;
      } else if (typeof rawDate === 'string' && rawDate) {
        // Standard ISO or YYYY-MM-DD string parsing
        const parsed = new Date(
          rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`
        );
        timestamp = isNaN(parsed.getTime())
          ? new Date(rawDate).getTime()
          : parsed.getTime();
      } else if (rawDate instanceof Date) {
        timestamp = rawDate.getTime();
      }

      return {
        ...item,
        timestamp: isNaN(timestamp) ? 0 : timestamp,
      };
    })
    .filter((item) => item.timestamp > 0);

  return prepared.sort((a, b) => a.timestamp - b.timestamp);
}

export interface TimeXAxisPropsOptions {
  chartScaleMode: 'time' | 'point';
  dateKey?: string;
  timestampKey?: string;
  tickFormatter?: (val: any) => string;
}

/**
 * Generates XAxis props depending on whether chartScaleMode is 'time' or 'point'.
 */
export function getTimeXAxisProps(options: TimeXAxisPropsOptions) {
  const {
    chartScaleMode,
    dateKey = 'date',
    timestampKey = 'timestamp',
    tickFormatter,
  } = options;

  if (chartScaleMode === 'time') {
    return {
      type: 'number' as const,
      dataKey: timestampKey,
      domain: ['dataMin', 'dataMax'] as [string, string],
      scale: 'time' as const,
      tickFormatter,
    };
  }

  return {
    type: 'category' as const,
    dataKey: dateKey,
    domain: undefined,
    scale: undefined,
    tickFormatter,
  };
}

/**
 * Parses a date or timestamp value into a numeric timestamp in milliseconds.
 */
export function parseDateToTimestamp(rawDate: any): number {
  if (typeof rawDate === 'number') return rawDate;
  if (typeof rawDate === 'string' && rawDate.trim()) {
    const trimmed = rawDate.trim();
    // Handle stringified epoch timestamps (e.g. "1767225600000")
    if (/^\d+$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!isNaN(num) && num > 0) return num;
    }
    const parsed = new Date(
      trimmed.includes('T') ? trimmed : `${trimmed}T00:00:00`
    );
    const ts = isNaN(parsed.getTime())
      ? new Date(trimmed).getTime()
      : parsed.getTime();
    return isNaN(ts) ? 0 : ts;
  }
  if (rawDate instanceof Date) {
    const ts = rawDate.getTime();
    return isNaN(ts) ? 0 : ts;
  }
  return 0;
}

export interface TimeSyncOptions {
  dateKey?: string;
  timestampKey?: string;
}

/**
 * Creates a custom Recharts syncMethod function for synchronized charts (syncId).
 * Signature in Recharts 3.x: (ticks: TooltipAxisTick[], param: SyncMethodParam) => index
 * Matches hovered points by closest date/timestamp across time-based and point-based charts,
 * falling back to standard index matching for non-time charts.
 */
export function getTimeSyncMethod<T extends Record<string, any>>(
  _data?: T[],
  _options?: TimeSyncOptions
) {
  return (ticks: any[], param: any): number => {
    if (!ticks || !Array.isArray(ticks) || ticks.length === 0) return 0;
    if (!param) return 0;

    let targetTimestamp: number | null = null;

    // Extract target date/timestamp from param.activeLabel
    if (param.activeLabel != null && param.activeLabel !== '') {
      const parsed = parseDateToTimestamp(param.activeLabel);
      if (parsed > 0) targetTimestamp = parsed;
    }

    if (targetTimestamp != null && targetTimestamp > 0) {
      let closestIndex = -1;
      let minDiff = Infinity;

      for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        if (tick == null) continue;

        let tickTs = 0;
        if (tick.value != null && tick.value !== '') {
          tickTs = parseDateToTimestamp(tick.value);
        }

        if (tickTs > 0) {
          const diff = Math.abs(tickTs - targetTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
      }

      if (closestIndex >= 0) {
        return closestIndex;
      }
    }

    // Fallback: use activeTooltipIndex or activeIndex if present
    const fallback = param.activeTooltipIndex ?? param.activeIndex ?? 0;
    return Math.min(Math.max(0, Number(fallback) || 0), ticks.length - 1);
  };
}
