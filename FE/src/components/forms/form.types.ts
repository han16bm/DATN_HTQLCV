export type FormOption = { value: string; label: string; parentValue?: string };
export type CompareField = {
  name: string;
  label: string;
  options?: FormOption[];
};
