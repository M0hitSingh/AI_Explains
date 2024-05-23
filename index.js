const ApiError = require("./lib/error");
const ModelVersionIdentifier = require("./lib/identifier");
const { withAutomaticRetries } = require("./lib/util");

const collections = require("./lib/collections");
const deployments = require("./lib/deployments");
const hardware = require("./lib/hardware");
const models = require("./lib/models");
const predictions = require("./lib/predictions");
const trainings = require("./lib/trainings");

const packageJSON = require("./package.json");


class Replicate {

  constructor(options = {}) {
    this.auth = options.auth || process.env.REPLICATE_API_TOKEN;
    this.userAgent =
      options.userAgent || `replicate-javascript/${packageJSON.version}`;
    this.baseUrl = options.baseUrl || "https://api.replicate.com/v1";
    this.fetch = options.fetch || globalThis.fetch;

    this.collections = {
      list: collections.list.bind(this),
      get: collections.get.bind(this),
    };

    this.deployments = {
      predictions: {
        create: deployments.predictions.create.bind(this),
      },
    };

    this.hardware = {
      list: hardware.list.bind(this),
    };

    this.models = {
      get: models.get.bind(this),
      list: models.list.bind(this),
      create: models.create.bind(this),
      versions: {
        list: models.versions.list.bind(this),
        get: models.versions.get.bind(this),
      },
      predictions: {
        create: models.predictions.create.bind(this),
      },
    };

    this.predictions = {
      create: predictions.create.bind(this),
      get: predictions.get.bind(this),
      cancel: predictions.cancel.bind(this),
      list: predictions.list.bind(this),
    };

    this.trainings = {
      create: trainings.create.bind(this),
      get: trainings.get.bind(this),
      cancel: trainings.cancel.bind(this),
      list: trainings.list.bind(this),
    };
  }


  async run(ref, options, progress) {
    const { wait, ...data } = options;

    const identifier = ModelVersionIdentifier.parse(ref);

    let prediction;
    if (identifier.version) {
      prediction = await this.predictions.create({
        ...data,
        version: identifier.version,
      });
    } else {
      prediction = await this.models.predictions.create(
        identifier.owner,
        identifier.name,
        data
      );
    }

    if (progress) {
      progress(prediction);
    }

    const { signal } = options;

    prediction = await this.wait(
      prediction,
      wait || {},
      async (updatedPrediction) => {

        if (progress) {
          progress(updatedPrediction);
        }

        if (signal && signal.aborted) {
          await this.predictions.cancel(updatedPrediction.id);
          return true; 
        }

        return false;
      }
    );

    // Call progress callback with the completed prediction object
    if (progress) {
      progress(prediction);
    }

    if (prediction.status === "failed") {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    return prediction.output;
  }


  async request(route, options) {
    const { auth, baseUrl, userAgent } = this;

    let url;
    if (route instanceof URL) {
      url = route;
    } else {
      url = new URL(
        route.startsWith("/") ? route.slice(1) : route,
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
      );
    }

    const { method = "GET", params = {}, data } = options;

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const headers = new Headers();
    if (auth) {
      headers.append("Authorization", `Token ${auth}`);
    }
    headers.append("Content-Type", "application/json");
    headers.append("User-Agent", userAgent);
    if (options.headers) {
      for (const [key, value] of options.headers.entries()) {
        headers.append(key, value);
      }
    }

    const init = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };

    const shouldRetry =
      method === "GET"
        ? (response) => response.status === 429 || response.status >= 500
        : (response) => response.status === 429;

    const _fetch = this.fetch; // eslint-disable-line no-underscore-dangle
    const response = await withAutomaticRetries(async () => _fetch(url, init), {
      shouldRetry,
    });

    if (!response.ok) {
      const request = new Request(url, init);
      const responseText = await response.text();
      throw new ApiError(
        `Request to ${url} failed with status ${response.status} ${response.statusText}: ${responseText}.`,
        request,
        response
      );
    }

    return response;
  }


  async *paginate(endpoint) {
    const response = await endpoint();
    yield response.results;
    if (response.next) {
      const nextPage = () =>
        this.request(response.next, { method: "GET" }).then((r) => r.json());
      yield* this.paginate(nextPage);
    }
  }

  async wait(prediction, options, stop) {
    const { id } = prediction;
    if (!id) {
      throw new Error("Invalid prediction");
    }

    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      return prediction;
    }

    // eslint-disable-next-line no-promise-executor-return
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const interval = (options && options.interval) || 500;

    let updatedPrediction = await this.predictions.get(id);

    while (
      updatedPrediction.status !== "succeeded" &&
      updatedPrediction.status !== "failed" &&
      updatedPrediction.status !== "canceled"
    ) {
      /* eslint-disable no-await-in-loop */
      if (stop && (await stop(updatedPrediction)) === true) {
        break;
      }

      await sleep(interval);
      updatedPrediction = await this.predictions.get(prediction.id);
      /* eslint-enable no-await-in-loop */
    }

    if (updatedPrediction.status === "failed") {
      throw new Error(`Prediction failed: ${updatedPrediction.error}`);
    }

    return updatedPrediction;
  }
}

module.exports = {Replicate};
