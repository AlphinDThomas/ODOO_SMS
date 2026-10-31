import { Check, AlertCircle, PauseCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatusTimeline({ status }) {
  const steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'QUOTATION', label: 'Quotation' },
    { key: 'CONFIRMED', label: 'Confirmed' },
    { key: 'ACTIVE', label: 'Active' },
  ];

  const standardOrder = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE'];
  const currentIndex = standardOrder.indexOf(status);

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />

        {steps.map((step, idx) => {
          const isPassed = currentIndex > idx || (currentIndex === -1 && ['PAUSED', 'CLOSED', 'EXPIRED'].includes(status) && idx <= 3);
          const isCurrent = status === step.key;

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 bg-white px-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all',
                  isPassed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-slate-900 border-slate-900 text-white ring-4 ring-slate-100'
                    : 'bg-white border-slate-300 text-slate-400',
                )}
              >
                {isPassed ? <Check className="size-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 font-medium whitespace-nowrap',
                  isCurrent ? 'text-slate-900 font-semibold' : isPassed ? 'text-emerald-700' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}

        {/* Special status callout if Paused, Expired, or Closed */}
        {['PAUSED', 'EXPIRED', 'CLOSED'].includes(status) && (
          <div className="flex flex-col items-center relative z-10 bg-white px-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2',
                status === 'PAUSED'
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : status === 'EXPIRED'
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'bg-slate-600 border-slate-600 text-white',
              )}
            >
              {status === 'PAUSED' && <PauseCircle className="size-4" />}
              {status === 'EXPIRED' && <AlertCircle className="size-4" />}
              {status === 'CLOSED' && <XCircle className="size-4" />}
            </div>
            <span
              className={cn(
                'text-xs mt-1.5 font-semibold uppercase tracking-wider',
                status === 'PAUSED'
                  ? 'text-amber-600'
                  : status === 'EXPIRED'
                  ? 'text-rose-600'
                  : 'text-slate-600',
              )}
            >
              {status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
