import type {
  addMemberSchema,
  memberPermissionsSchema,
  membershipSchema,
  projectMemberQuerySchema,
} from "@/features/project-members/schemas/project-members.schema";
import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type MembershipDto = z.output<typeof membershipSchema>;
export type ProjectMemberQuery = z.input<typeof projectMemberQuerySchema>;
export type ProjectMemberList = Page<MembershipDto>;
export type AddProjectMemberInput = z.input<typeof addMemberSchema>;
export type AddProjectMemberArgs = {
  projectId: string;
  payload: AddProjectMemberInput;
};
export type UpdateProjectMemberPermissionsInput = z.input<
  typeof memberPermissionsSchema
>;
export type UpdateProjectMemberPermissionsArgs = {
  projectId: string;
  membershipId: string;
  payload: UpdateProjectMemberPermissionsInput;
  version: number;
};
export type EndProjectMembershipInput = z.input<typeof reasonSchema>;
export type EndProjectMembershipArgs = {
  projectId: string;
  membershipId: string;
  payload: EndProjectMembershipInput;
  version: number;
};
