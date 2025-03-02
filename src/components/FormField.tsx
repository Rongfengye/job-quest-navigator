
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FormFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  isTextarea?: boolean;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  isTextarea = false,
  className = 'border-gray-300',
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-interview-primary font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {isTextarea ? (
        <Textarea
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`${isTextarea ? 'min-h-[150px]' : ''} ${className}`}
        />
      ) : (
        <Input
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={className}
        />
      )}
    </div>
  );
};

export default FormField;
