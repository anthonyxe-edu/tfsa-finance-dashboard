import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

export const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  }),
);

export const PLAID_PRODUCTS = [Products.Transactions];
export const PLAID_COUNTRY_CODES = [CountryCode.Ca, CountryCode.Us];

export function plaidConfigured(): boolean {
  return Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}
