import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    const classNames = className ? `c-button ${className}` : 'c-button';
    return (
      <button className={classNames} {...props} ref={ref}>
        {children}
      </button>
    );
  }
);