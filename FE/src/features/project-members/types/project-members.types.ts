import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
import type {
  addMemberSchema,
  memberRoleSchema,
  membershipSchema,
  projectMemberQuerySchema,
} from "../schemas/project-members.schema";
export type MembershipDto = z.output<typeof membershipSchema>;
export type ProjectMemberQuery = z.input<typeof projectMemberQuerySchema>;
export type ProjectMemberList = Page<MembershipDto>;
export type AddProjectMemberInput = z.input<typeof addMemberSchema>;
export type AddProjectMemberArgs = {
  projectId: string;
  payload: AddProjectMemberInput;
};
export type UpdateProjectMemberRoleInput = z.input<typeof memberRoleSchema>;
export type UpdateProjectMemberRoleArgs = {
  projectId: string;
  membershipId: string;
  payload: UpdateProjectMemberRoleInput;
  version: number;
};
export type EndProjectMembershipInput = z.input<typeof reasonSchema>;
export type EndProjectMembershipArgs = {
  projectId: string;
  membershipId: string;
  payload: EndProjectMembershipInput;
  version: number;
};
