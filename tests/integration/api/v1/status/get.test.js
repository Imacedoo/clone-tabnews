import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("GET /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Retrieving current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");
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
