import database from "infra/database.js";
import { InternalServerError } from "infra/errors";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const databaseVersionResult = await database.query("SHOW server_version;");
    const databaseVersion = databaseVersionResult.rows[0].server_version;

    const databaseMaxConnectionsResult = await database.query("SHOW max_connections;");
    const databaseMaxConnections = databaseMaxConnectionsResult.rows[0].max_connections;

    const databaseName = process.env.POSTGRES_DB;
    const databaseOpenedConnectionResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const databaseOpenedConnection = databaseOpenedConnectionResult.rows[0].count;

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: databaseVersion,
          max_connections: parseInt(databaseMaxConnections),
          opened_connections: databaseOpenedConnection,
        },
      },
    });
  } catch (error) {
    console.log("\n Erro no controller");

    const publicErrorObject = new InternalServerError({
      cause: error,
    });
    console.log(publicErrorObject);
    response.status(500).json(publicErrorObject);
  }
}

export default status;
