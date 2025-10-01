"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("0,00");

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value]);

    const formatCurrency = (val: string) => {
      const numericValue = val.replace(/\D/g, "");
      if (!numericValue || numericValue === "0") return "0,00";

      const intValue = parseInt(numericValue, 10);
      const integerPart = Math.floor(intValue / 100).toString();
      const decimalPart = (intValue % 100).toString().padStart(2, "0");

      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

      return `${formattedInteger},${decimalPart}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = inputValue.replace(/\D/g, "");

      const formatted = formatCurrency(numericValue);
      setDisplayValue(formatted);

      if (onChange) {
        onChange(formatted);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const numericValue = displayValue.replace(/\D/g, "");
        const newValue = numericValue.slice(0, -1);
        const formatted = formatCurrency(newValue);
        setDisplayValue(formatted);
        if (onChange) {
          onChange(formatted);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
