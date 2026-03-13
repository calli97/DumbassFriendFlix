import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`px-6 py-4 border-b border-slate-100 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = '', ...props }: CardProps) {
  return (
    <div {...props} className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}
