import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "drizzle/migrations/0005_protect_editorial_associations.sql"),
  "utf8",
);

describe("RLS editorial_associations", () => {
  it("revoca ogni accesso editoriale ad anon", () => {
    expect(migration).toContain(
      "REVOKE SELECT, INSERT, UPDATE ON public.editorial_associations FROM anon",
    );
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*?TO anon/i);
  });

  it("limita SELECT, INSERT e UPDATE al ruolo instructor in app_metadata", () => {
    expect(migration.match(/TO authenticated/g)).toHaveLength(3);
    expect(migration.match(/'app_metadata' ->> 'role'\) = 'instructor'/g)).toHaveLength(4);
    expect(migration).toContain("FOR INSERT");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("FOR SELECT");
  });
});
