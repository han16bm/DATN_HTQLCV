import type {
  createTeamSchema,
  teamMembersSchema,
  teamQuerySchema,
  teamRowSchema,
  teamSchema,
  updateTeamSchema,
} from "@/features/organization/schemas/team.schema";
import type {
  createUnitSchema,
  unitQuerySchema,
  unitRowSchema,
  unitSchema,
  updateUnitSchema,
} from "@/features/organization/schemas/unit.schema";
import type { reasonSchema } from "@/lib/validation/common.schema";
import { type Page } from "@/types/common";
import { type z } from "zod";
export type TeamDto = z.output<typeof teamSchema>;
export type UnitDto = z.output<typeof unitSchema>;
export type UnitQuery = z.input<typeof unitQuerySchema>;
export type UnitRow = z.output<typeof unitRowSchema>;
export type UnitList = Page<UnitRow>;
export type CreateUnitInput = z.input<typeof createUnitSchema>;
export type UpdateUnitInput = z.input<typeof updateUnitSchema>;
export type UpdateUnitArgs = {
  unitId: string;
  payload: UpdateUnitInput;
  version: number;
};
export type DeactivateUnitInput = z.input<typeof reasonSchema>;
export type DeactivateUnitArgs = {
  unitId: string;
  payload: DeactivateUnitInput;
  version: number;
};
export type TeamQuery = z.input<typeof teamQuerySchema>;
export type TeamRow = z.output<typeof teamRowSchema>;
export type TeamList = Page<TeamRow>;
export type CreateTeamInput = z.input<typeof createTeamSchema>;
export type UpdateTeamInput = z.input<typeof updateTeamSchema>;
export type UpdateTeamArgs = {
  teamId: string;
  payload: UpdateTeamInput;
  version: number;
};
export type ReplaceTeamMembersInput = z.input<typeof teamMembersSchema>;
export type ReplaceTeamMembersArgs = {
  teamId: string;
  payload: ReplaceTeamMembersInput;
  version: number;
};
export type DeactivateTeamInput = z.input<typeof reasonSchema>;
export type DeactivateTeamArgs = {
  teamId: string;
  payload: DeactivateTeamInput;
  version: number;
};
