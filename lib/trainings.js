
async function createTraining(model_owner, model_name, version_id, options) {
  const { ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}/trainings`,
    {
      method: "POST",
      data,
    }
  );

  return response.json();
}


async function getTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}`, {
    method: "GET",
  });

  return response.json();
}


async function cancelTraining(training_id) {
  const response = await this.request(`/trainings/${training_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

async function listTrainings() {
  const response = await this.request("/trainings", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  create: createTraining,
  get: getTraining,
  cancel: cancelTraining,
  list: listTrainings,
};
