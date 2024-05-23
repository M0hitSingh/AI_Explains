
async function createPrediction(options) {
  const { stream, ...data } = options;

  if (data.webhook) {
    try {
      // eslint-disable-next-line no-new
      new URL(data.webhook);
    } catch (err) {
      throw new Error("Invalid webhook URL");
    }
  }

  const response = await this.request("/predictions", {
    method: "POST",
    data: { ...data, stream },
  });

  return response.json();
}


async function getPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}`, {
    method: "GET",
  });

  return response.json();
}


async function cancelPrediction(prediction_id) {
  const response = await this.request(`/predictions/${prediction_id}/cancel`, {
    method: "POST",
  });

  return response.json();
}

async function listPredictions() {
  const response = await this.request("/predictions", {
    method: "GET",
  });

  return response.json();
}

module.exports = {
  create: createPrediction,
  get: getPrediction,
  cancel: cancelPrediction,
  list: listPredictions,
};
