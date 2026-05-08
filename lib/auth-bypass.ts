export const AUTH_BYPASS_ENABLED =
  process.env.AUTH_BYPASS === "true" || process.env.NEXT_PUBLIC_AUTH_BYPASS === "true";

export const DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000099";

export const DEMO_ORGANIZATION = {
  id: DEMO_ORGANIZATION_ID,
  name: "Escola Demonstracao Ficticia",
};
