const { exec } = require("node:child_process");

function checkPostgres() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(_, stdout) {
    const isConnectionReady = stdout.search("accepting connections") !== -1;

    if (!isConnectionReady) {
      process.stdout.write(".");
      checkPostgres();
      return;
    }

    process.stdout.write("\n🟢 Postgres está pronto para aceitar conexões!\n");
  }
}
process.stdout.write("\n🔴 Aguardando Postgres");
checkPostgres();
