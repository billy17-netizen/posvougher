import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/tailwind";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "primary" | "secondary" | "accent";
}

export const Card = ({
  children,
  className,
  variant = "default",
  ...props
}: CardProps) => {
  const variantClasses = {
    default: "bg-white",
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    accent: "bg-brutalism-yellow text-brutalism-black",
  };

  return (
    <div
      className={cn(
        "p-4 border-3 border-brutalism-black shadow-brutal",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  title?: string;
  description?: string;
}

export const CardHeader = ({
  children,
  className,
  title,
  description,
  ...props
}: CardHeaderProps) => {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {title && <h3 className="text-xl font-bold">{title}</h3>}
      {description && <p className="text-sm opacity-80">{description}</p>}
      {children}
    </div>
  );
};

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = ({
  children,
  className,
  ...props
}: CardContentProps) => {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
};

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = ({
  children,
  className,
  ...props
}: CardFooterProps) => {
  return (
    <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props}>
      {children}
    </div>
  );
}; 