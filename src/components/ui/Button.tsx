import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/tailwind";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "danger" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = ({
  children,
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: ButtonProps) => {
  const baseClasses = "font-medium border-3 border-brutalism-black transform active:translate-y-1 active:shadow-none transition-transform";

  const variantClasses = {
    primary: "bg-primary text-white shadow-brutal",
    secondary: "bg-secondary text-white shadow-brutal",
    accent: "bg-brutalism-yellow text-brutalism-black shadow-brutal",
    danger: "bg-brutalism-red text-white shadow-brutal",
    success: "bg-brutalism-green text-white shadow-brutal",
    outline: "bg-white text-brutalism-black border-brutalism-black shadow-brutal",
  };

  const sizeClasses = {
    sm: "py-1 px-3 text-sm",
    md: "py-2 px-4 text-base",
    lg: "py-3 px-6 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}; 