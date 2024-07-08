import retry from "async-retry";

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

export default {
  waitForAllServices,
};
