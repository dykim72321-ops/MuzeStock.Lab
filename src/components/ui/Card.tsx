import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'glass';
}

export const Card = ({ children, className, variant = 'default', ...props }: CardProps) => {
  return (
    <div
      className={clsx(
        'rounded-xl border transition-all duration-200',
        variant === 'default' && 'bg-slate-900 border-slate-800 shadow-sm hover:border-slate-700',
        variant === 'glass' && 'bg-slate-900/60 backdrop-blur-md border-slate-700/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
