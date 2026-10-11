/** Small labelled text input shared by the sidebar panels. */
export function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  wide?: boolean;
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <label className={props.wide ? "field wide" : "field"}>
      <span>{props.label}</span>
      <input
        type={props.type ?? "text"}
        value={props.value}
        data-testid={props.testId}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </label>
  );
}
