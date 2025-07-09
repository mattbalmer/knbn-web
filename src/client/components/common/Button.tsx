import { ButtonHTMLAttributes, forwardRef } from 'react';
import classnames from 'classnames-ts';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    const classNames = classnames('c-button', className);
    return (
      <button className={classNames} {...props} ref={ref}>
        {children}
      </button>
    );
  }
);