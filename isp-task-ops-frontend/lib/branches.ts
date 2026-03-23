import { publicApi } from "@/lib/api";

export interface Branch {
  id: string;
  name: string;
  code?: string;
}

type BranchApiRow = {
  id?: string | number;
  name?: string;
  code?: string;
};

type BranchesResponse = {
  data?: BranchApiRow[] | unknown;
  message?: string;
} | BranchApiRow[];

export const getBranches = async (): Promise<Branch[]> => {
  try {
    console.info("getBranches request URL", `${publicApi.defaults.baseURL}/api/branches`);

    const response = await publicApi.get<BranchesResponse>("/api/branches", {
      headers: {
        Accept: "application/json",
      },
    });

    console.info("getBranches raw response.data", response.data);

    const rows = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

    const parsed = rows
      .filter((branch): branch is BranchApiRow => Boolean(branch?.id) && Boolean(branch?.name))
      .map((branch) => ({
        id: String(branch.id),
        name: String(branch.name),
        code: branch.code,
      }));

    console.info("getBranches parsed branches", parsed);

    return parsed;
  } catch (error) {
    console.error("getBranches failed", error);
    return [];
  }
};
