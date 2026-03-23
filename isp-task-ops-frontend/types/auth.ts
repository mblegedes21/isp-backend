import type { Role } from "./role";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branchId?: string | null;
  branchName?: string | null;
}

export type AuthToken = string;
