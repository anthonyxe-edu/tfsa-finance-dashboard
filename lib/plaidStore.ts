import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), ".plaid-store.json");

export type PlaidStore = { access_token: string; item_id: string };

export async function readStore(): Promise<PlaidStore | null> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as PlaidStore;
  } catch {
    return null;
  }
}

export async function writeStore(s: PlaidStore): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), "utf8");
}
