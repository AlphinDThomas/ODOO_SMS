import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-900 text-white',
        secondary: 'bg-slate-100 text-slate-900',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        warning: 'bg-amber-50 text-amber-700 border border-amber-200',
        info: 'bg-blue-50 text-blue-700 border border-blue-200',
        danger: 'bg-rose-50 text-rose-700 border border-rose-200',
        outline: 'border border-slate-200 text-slate-700 bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function StatusBadge({ status }) {
  const map = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    QUOTATION: { label: 'Quotation', variant: 'warning' },
    CONFIRMED: { label: 'Confirmed', variant: 'info' },
    ACTIVE: { label: 'Active', variant: 'success' },
    PAUSED: { label: 'Paused', variant: 'warning' },
    EXPIRED: { label: 'Expired', variant: 'danger' },
    CLOSED: { label: 'Closed', variant: 'outline' },
    PAID: { label: 'Paid', variant: 'success' },
    PARTIALLY_PAID: { label: 'Partially Paid', variant: 'warning' },
    CANCELLED: { label: 'Cancelled', variant: 'outline' },
  };

  const config = map[status] || { label: status, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
