async function getModel(model_owner, model_name) {
  const response = await this.request(`/models/${model_owner}/${model_name}`, {
    method: "GET",
  });

  return response.json();
}


async function listModelVersions(model_owner, model_name) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions`,
    {
      method: "GET",
    }
  );

  return response.json();
}

async function getModelVersion(model_owner, model_name, version_id) {
  const response = await this.request(
    `/models/${model_owner}/${model_name}/versions/${version_id}`,
    {
      method: "GET",
    }
  );

  return response.json();
}

async function listModels() {
  const response = await this.request("/models", {
    method: "GET",
  });

  return response.json();
}


async function createModel(model_owner, model_name, options) {
  const data = { owner: model_owner, name: model_name, ...options };

  const response = await this.request("/models", {
    method: "POST",
    data,
  });

  return response.json();
}


async function createPrediction(model_owner, model_name, options) {
  const { stream, ...data } = options;

  const response = await this.request(
    `/models/${model_owner}/${model_name}/predictions`,
    {
      method: "POST",
      data: { ...data, stream },
    }
  );

  return response.json();
}

module.exports = {
  get: getModel,
  list: listModels,
  create: createModel,
  versions: { list: listModelVersions, get: getModelVersion },
  predictions: { create: createPrediction },
};
