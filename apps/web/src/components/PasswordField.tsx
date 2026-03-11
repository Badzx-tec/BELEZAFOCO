import { useState, type InputHTMLAttributes } from "react";
import { Field, Input } from "./ui";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  inputClassName?: string;
};

export function PasswordField({
  label,
  hint,
  error,
  fieldClassName,
  inputClassName,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} hint={hint} error={error} className={fieldClassName}>
      <div className="relative">
        <Input {...inputProps} type={visible ? "text" : "password"} className={cx("pr-24", inputClassName)} />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </Field>
  );
}
