import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import authorization from "models/authorization";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router
  .use(controller.injectAnonymousOrUser)
  .get(getHandler)
  .patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;

  const userFound = await user.findOneByUsername(username);

  return response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  // user, feature, resource
  const userTryingToRequest = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToRequest, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário",
      action: "Verifique se você possui a feature necessária para atualizar outro usuário",
    });
  }

  const updatedUser = await user.update(username, userInputValues);

  return response.status(200).json(updatedUser);
}
