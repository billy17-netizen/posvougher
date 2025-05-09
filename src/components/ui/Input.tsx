import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/tailwind";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-1 font-medium text-brutalism-black">
            {label}
          </label>
        )}
        <input
          className={cn(
            "w-full py-2 px-3 bg-white border-3 border-brutalism-black shadow-brutal-sm focus:outline-none focus:ring-0 focus:shadow-none transform focus:translate-y-1 transition-transform",
            error && "border-brutalism-red",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-brutalism-red">{error}</p>}
      </div>
    );
  }
); 