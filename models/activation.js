import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";
import webserver from "infra/webserver";
import user from "./user";

const activation = {
  sendEmailToUser,
  create,
  findOneValidByToken,
  markTokenAsUsed,
  activateUserByUserId,
};

export default activation;

const EXPIRATION_IN_MILLISECONDS = 60 * 15 * 1000; // 15 minutos

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const newToken = await runInsertQuery(userId, expiresAt);

  return newToken;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO user_activation_tokens (
          user_id,
          expires_at
        ) VALUES (
          $1,
          $2
        )
          RETURNING *;
      `,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneValidByToken(tokenId) {
  const token = await runSelectQuery(tokenId);

  return token;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1;
      `,
      values: [userId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O token de ativação utilizado não foi encontrado no sistema ou expirou.",
        action: "Faça um novo cadastro",
      });
    }

    return results.rows[0];
  }
}

async function markTokenAsUsed(activationTokenId) {
  const usedActivationToken = await runUpdateQuery(activationTokenId);

  return usedActivationToken;

  async function runUpdateQuery(activationTokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *;
    `,
      values: [activationTokenId],
    });

    return results.rows[0];
  }
}

async function activateUserByUserId(userId) {
  const activatedUser = await user.setFeatures(userId, ["create:session"]);

  return activatedUser;
}

async function sendEmailToUser(user, activationToken) {
  await email.send({
    from: "<contato@imacedo.dev.br>",
    to: user.email,
    subject: "Ative seu cadastro na plataforma",
    text: `${user.username}, clique no link abaixo para ativar seu cadastro:

${webserver.origin}/cadastro/ativar/${activationToken.id}

Atenciosamente,
Igor Prates`,
  });
}
