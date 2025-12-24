import email from "infra/email";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Imacedo Dev <contato@imacedo.dev.br>",
      to: "imacedo2000.im@gmail.com",
      subject: "Teste de assunto",
      text: "Teste do corpo",
    });

    await email.send({
      from: "Imacedo Dev <contato@imacedo.dev.br>",
      to: "imacedo2000.im@gmail.com",
      subject: "Último email enviado",
      text: "Corpo do último e-mail",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@imacedo.dev.br>");
    expect(lastEmail.recipients[0]).toBe("<imacedo2000.im@gmail.com>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último e-mail\r\n");
  });
});
