import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database";
import migrator from "models/migrator";
import user from "models/user";
import session from "models/session";

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
};

export default orchestrator;

async function waitForAllServices() {
  await waitForWebService();

  function waitForWebService() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status/");

      if (!response.ok) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("DROP SCHEMA public cascade; CREATE SCHEMA public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  const defaultUserObject = {
    username: faker.internet.username().replace(/[_.-]/g, ""),
    email: faker.internet.email(),
    password: "senhaSegura",
  };

  return await user.create({
    ...defaultUserObject,
    ...userObject,
  });
}

async function createSession(userId) {
  return await session.create(userId);
}
