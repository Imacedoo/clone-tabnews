import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody.updated_at).toBeDefined();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(typeof responseBody.dependencies.database.max_connections).toBe("number");
      // Nesse controller, nessa situação, é esperado 1 conexão apenas, se tiver mais está vazando.
      expect(responseBody.dependencies.database.opened_connections).toEqual(1);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Privileged user", () => {
    test("With `read:status:all`", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);

      await orchestrator.addFeatureToUser(createdUser, ["read:status:all"]);

      const sessionObject = await orchestrator.createSession(activatedUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });

      expect(response.status).toBe(200);

      const {
        updated_at,
        dependencies: {
          database: { version, max_connections, opened_connections },
        },
      } = await response.json();

      expect(updated_at).toBeDefined();

      const parsedUpdatedAt = new Date(updated_at).toISOString();
      expect(updated_at).toEqual(parsedUpdatedAt);

      expect(version).toMatch(/\b\d{1,2}\.\d{1,2}\b/);
      expect(typeof max_connections).toBe("number");
      // Nesse controller, nessa situação, é esperado 1 conexão apenas, se tiver mais está vazando.
      expect(opened_connections).toEqual(1);
    });
  });
});
