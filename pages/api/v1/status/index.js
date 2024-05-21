function status(request, response) {
  response.status(200).json({
    message: "Eai!",
  });
}

export default status;
