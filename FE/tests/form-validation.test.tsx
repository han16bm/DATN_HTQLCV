// @vitest-environment jsdom
import { Form } from "@/components/forms/form";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-field";
import { createUnitSchema } from "@/features/organization/schemas/unit.schema";
import { createUserSchema } from "@/features/users/schemas/user-form.schema";
import type { CreateUserInput } from "@/features/users/types/users.types";
import { createSubmissionSchema } from "@/features/submissions/schemas/submissions.schema";
import { validationMessage } from "@/lib/forms/validation-message";
import { useUI } from "@/stores/ui-store";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, it, vi } from "vitest";
import { z } from "zod";

afterEach(() => {
  cleanup();
  useUI.getState().reset();
});
const user: CreateUserInput = {
  username: "new.member",
  displayName: "Thành viên mới",
  email: "member@example.test",
  unitId: "unit-product",
  initialPassword: "Start@12345",
};

function UserForm({
  values,
  onSubmit,
}: {
  values: Partial<CreateUserInput>;
  onSubmit: (values: CreateUserInput) => Promise<void>;
}) {
  const form = useForm<
    z.input<typeof createUserSchema>,
    unknown,
    CreateUserInput
  >({
    resolver: zodResolver(createUserSchema, { error: validationMessage }),
    defaultValues: { ...user, ...values },
  });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormSelect
        label="Đơn vị"
        options={[{ value: "unit-product", label: "Phòng sản phẩm" }]}
        {...form.register("unitId")}
        error={form.formState.errors.unitId}
      />
      <FormInput
        label="Email"
        type="email"
        {...form.register("email")}
        error={form.formState.errors.email}
      />
      <FormInput
        label="Mật khẩu khởi tạo"
        type="password"
        {...form.register("initialPassword")}
        error={form.formState.errors.initialPassword}
      />
    </Form>
  );
}

it.each(["", "   ", undefined])(
  "asks for a unit instead of exposing a resource ID (%s)",
  async (unitId) => {
    const submit = vi.fn();
    render(<UserForm values={{ unitId }} onSubmit={submit} />);
    fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
    expect(await screen.findByText("Vui lòng chọn đơn vị.")).toBeTruthy();
    expect(submit).not.toHaveBeenCalled();
  },
);

it("explains malformed email and short passwords in Vietnamese", async () => {
  render(
    <UserForm
      values={{ email: "not-email", initialPassword: "abc" }}
      onSubmit={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  expect(await screen.findByText("Vui lòng nhập email hợp lệ.")).toBeTruthy();
  expect(
    await screen.findByText("Mật khẩu khởi tạo phải có ít nhất 8 ký tự."),
  ).toBeTruthy();
});

const minutesSchema = z.object({
  minutes: z.number().int().positive().max(1440),
});
function MinutesForm({
  onSubmit,
}: {
  onSubmit: (values: z.input<typeof minutesSchema>) => Promise<void>;
}) {
  const form = useForm<z.input<typeof minutesSchema>>({
    resolver: zodResolver(minutesSchema, { error: validationMessage }),
  });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormInput
        label="Số phút"
        type="number"
        {...form.register("minutes", {
          setValueAs: (value: string) =>
            value === "" ? undefined : Number(value),
        })}
        error={form.formState.errors.minutes}
      />
    </Form>
  );
}
it.each([
  ["", "Vui lòng nhập số phút."],
  ["0", "Số phút phải lớn hơn 0."],
  ["1.5", "Số phút phải là số nguyên."],
  ["1441", "Số phút phải nhỏ hơn hoặc bằng 1440."],
])("rejects invalid minutes %s", async (value, message) => {
  const submit = vi.fn();
  render(<MinutesForm onSubmit={submit} />);
  fireEvent.change(screen.getByLabelText("Số phút"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  expect(await screen.findByText(message)).toBeTruthy();
  expect(submit).not.toHaveBeenCalled();
});

it("shows an array item's business error beside its textarea", async () => {
  const schema = z.object({
    links: z
      .string()
      .transform((value) => [value])
      .pipe(createSubmissionSchema.shape.links),
  });
  function LinksForm() {
    const form = useForm<
      z.input<typeof schema>,
      unknown,
      z.output<typeof schema>
    >({
      resolver: zodResolver(schema, { error: validationMessage }),
      defaultValues: { links: "mailto:member@example.test" },
    });
    return (
      <Form form={form} onSubmit={vi.fn()}>
        <FormTextarea
          label="Liên kết minh chứng"
          {...form.register("links")}
          error={form.formState.errors.links}
        />
      </Form>
    );
  }
  render(<LinksForm />);
  fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  expect(await screen.findByText("Chỉ nhận liên kết HTTP/HTTPS")).toBeTruthy();
});

it("preserves nullable selections and parses a successful form only once", async () => {
  let parses = 0;
  const schema = createUnitSchema.transform((value) => {
    parses++;
    return value;
  });
  const submit = vi.fn();
  function UnitForm() {
    const form = useForm<
      z.input<typeof schema>,
      unknown,
      z.output<typeof schema>
    >({
      resolver: zodResolver(schema, { error: validationMessage }),
      defaultValues: { name: " Phòng mới ", parentId: null, managerId: null },
    });
    return (
      <Form form={form} onSubmit={submit}>
        <FormInput label="Tên đơn vị" {...form.register("name")} />
        <FormSelect
          label="Đơn vị cấp trên"
          options={[]}
          {...form.register("parentId", {
            setValueAs: (value: string) => value || null,
          })}
        />
        <FormSelect
          label="Người quản lý"
          options={[]}
          {...form.register("managerId", {
            setValueAs: (value: string) => value || null,
          })}
        />
      </Form>
    );
  }
  render(<UnitForm />);
  fireEvent.click(screen.getByRole("button", { name: "Lưu thông tin" }));
  await waitFor(() =>
    expect(submit).toHaveBeenCalledWith({
      name: "Phòng mới",
      parentId: null,
      managerId: null,
    }),
  );
  expect(parses).toBe(1);
});
