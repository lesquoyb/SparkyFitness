import { useTranslation } from 'react-i18next';
import { DateRangePickerWithPresets } from '@/components/ui/DateRangeWithPresets';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Dumbbell,
  BedDouble,
  Activity,
  Table as TableIcon,
  Pill,
  Clock,
  ListFilter,
} from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

interface ReportsControlsProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ReportsControls = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  activeTab,
  onTabChange,
}: ReportsControlsProps) => {
  const { t } = useTranslation();
  const { chartScaleMode, setChartScaleMode } = usePreferences();

  const reportTypes = [
    {
      id: 'charts',
      label: t('reports.nutrientsTab', 'Nutrients'),
      icon: BarChart3,
    },
    {
      id: 'measurements',
      label: t('reports.measurementsTab', 'Measurements'),
      icon: Activity,
    },
    {
      id: 'fasting',
      label: t('reports.fasting.insightsTab', 'Fasting'),
      icon: TrendingUp,
    },
    {
      id: 'exercise-charts',
      label: t('reports.exerciseProgressTab', 'Exercise'),
      icon: Dumbbell,
    },
    {
      id: 'sleep-analytics',
      label: t('reports.sleepTab', 'Sleep'),
      icon: BedDouble,
    },
    {
      id: 'stress-analytics',
      label: t('reports.stressTab', 'Stress'),
      icon: Activity,
    },
    {
      id: 'medications-reports',
      label: t('reports.medicationsTab', 'Medications'),
      icon: Pill,
    },
    {
      id: 'table',
      label: t('reports.tableTab', 'Table'),
      icon: TableIcon,
    },
  ];

  return (
    <div className="w-full flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1 flex-1">
        {reportTypes.map((type) => {
          const Icon = type.icon;
          const isActive = activeTab === type.id;
          return (
            <Button
              key={type.id}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange(type.id)}
              className={`rounded-full px-4 h-9 gap-2 transition-all ${
                isActive
                  ? 'bg-slate-200/60 dark:bg-muted shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{type.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Vertical Divider (Desktop Only) */}
      <div className="hidden lg:block w-px h-6 bg-border" />

      {/* Secondary Controls: Chart Scale Mode & Date Picker */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-full border border-border">
          <Button
            variant={chartScaleMode === 'time' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartScaleMode('time')}
            title={t(
              'reports.scaleOverTime',
              'Scale over time (proportional dates)'
            )}
            className={`rounded-full px-3 h-8 text-xs font-medium gap-1.5 ${
              chartScaleMode === 'time'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('reports.timeScale', 'Time')}</span>
          </Button>
          <Button
            variant={chartScaleMode === 'point' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setChartScaleMode('point')}
            title={t(
              'reports.scaleOverPoints',
              'Scale over data points (equal width)'
            )}
            className={`rounded-full px-3 h-8 text-xs font-medium gap-1.5 ${
              chartScaleMode === 'point'
                ? 'bg-background shadow-xs text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>{t('reports.pointScale', 'Points')}</span>
          </Button>
        </div>

        <DateRangePickerWithPresets
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
      </div>
    </div>
  );
};

export default ReportsControls;
