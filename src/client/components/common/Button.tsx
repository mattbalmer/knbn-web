import { ButtonHTMLAttributes, forwardRef } from 'react';
import './Button.css';

export type ButtonColor = 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'warning';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  color?: ButtonColor;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, color = 'default', ...props }, ref) => {
    const classNames = className ? `c-button c-button--${color} ${className}` : `c-button c-button--${color}`;
    return (
      <button className={classNames} {...props} ref={ref}>
        {children}
      </button>
    );
  }
);