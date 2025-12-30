import webserver from "infra/webserver";
import activation from "models/activation";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all successful)", () => {
  let createUserResponseBody;

  test("Create user account", async () => {
    const createUserResponse = await fetch("http://localhost:3000/api/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "RegistrationFlow",
        email: "registration.flow@gmail.com",
        password: "RegistrationFlowPassword",
      }),
    });

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "registration.flow@gmail.com",
      features: ["read:activation_token"],
      password: createUserResponseBody.password,
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@imacedo.dev.br>");
    expect(lastEmail.recipients[0]).toBe("<registration.flow@gmail.com>");
    expect(lastEmail.subject).toBe("Ative seu cadastro na plataforma");
    expect(lastEmail.text).toContain("RegistrationFlow");

    const sentActivationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${sentActivationTokenId}`,
    );

    const activationToken = await activation.findOneValidByToken(sentActivationTokenId);

    expect(activationToken.user_id).toBe(createUserResponseBody.id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Activate account", () => {});

  test("Login", () => {});

  test("Get user information", () => {});
});
