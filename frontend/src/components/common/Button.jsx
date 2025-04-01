import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  icon = null,
  ...props
}) => {
  // バリアントのクラス名マッピング
  const variantClass = {
    default: 'btn-default',
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    link: 'btn-link',
    ghost: 'btn-ghost'
  };

  // サイズのクラス名マッピング
  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
    xl: 'btn-xl'
  };

  // 最終的なクラス名の生成
  const buttonClasses = [
    'btn',
    variantClass[variant] || 'btn-default',
    sizeClass[size] || 'btn-md',
    fullWidth ? 'btn-full-width' : '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;