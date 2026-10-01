import { hasPermission, type User } from "../types";

describe("hasPermission", () => {
  const user: User = {
    id: "1",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
    role: "minister",
    permissions: [
      { slug: "members.read", name: "View members", category: "Members" },
      { slug: "members.create", name: "Create members", category: "Members" },
    ],
  };

  it("returns true when user has permission", () => {
    expect(hasPermission(user, "members.read")).toBe(true);
  });

  it("returns false when user lacks permission", () => {
    expect(hasPermission(user, "users.manage")).toBe(false);
  });

  it("returns false for null user", () => {
    expect(hasPermission(null, "members.read")).toBe(false);
  });
});
