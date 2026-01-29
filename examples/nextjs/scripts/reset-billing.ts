import { Database } from "bun:sqlite";

const db = new Database("local.db");

db.exec("DELETE FROM paymongoUsage");

console.log("✓ Billing data wiped");

db.close();
