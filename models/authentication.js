import { NotFoundError, UnauthorizedError } from "infra/errors";
import password from "./password";
import user from "./user";

const authentication = {
  getAuthenticatedUser,
};

export default authentication;

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);

    await validatePassword(providedPassword, storedUser.password);

    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: "Dados de autenticação não conferem.",
        action: "Verifique se os dados estão corretos e tente novamente.",
        cause: error,
      });
    }

    throw error;
  }

  async function findUserByEmail(providedEmail) {
    try {
      const storedUser = await user.findOneByEmail(providedEmail);

      return storedUser;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new UnauthorizedError({
          message: "E-mail não confere.",
          action: "Verifique se este dado está correto e tente novamente.",
        });
      }

      throw error;
    }
  }

  async function validatePassword(providedPassword, storedPassword) {
    const correctPasswordMatch = await password.compare(providedPassword, storedPassword);

    if (!correctPasswordMatch) {
      throw new UnauthorizedError({
        message: "Senha não confere.",
        action: "Verifique se este dado está correto e tente novamente.",
      });
    }
  }
}
