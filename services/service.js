import axios from "axios";

const ConstantsUrl = "http://localhost:3008/api/";
const AuthUrl = "http://localhost:3008/";


// onst ConstantsUrl = "https://api.alagare.net/api/";
// const AuthUrl = "https://api.alagare.net/";
/** Same public setup name as mobile app — not a secret */
const APP_SETUP_NAME = "alagare-mobile";

const getToken = () =>
  typeof window !== "undefined" ? localStorage?.getItem("token") || "" : "";

const getApiKey = () => {
  if (typeof window === "undefined") return "";
  return localStorage?.getItem("apiKey") || "";
};

const getClientKeys = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("clientKeys") || "{}") || {};
  } catch {
    return {};
  }
};

const setClientKeys = (keys) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("clientKeys", JSON.stringify(keys || {}));
};

const getGoogleMapsKey = () => getClientKeys()?.googleMaps || "";

/** Fetch X-API-Key (+ optional keys) from backend by app setup name */
async function ensureApiKey() {
  if (typeof window === "undefined") return "";

  try {
    const res = await axios.get(`${AuthUrl}setup/${APP_SETUP_NAME}`, { timeout: 15000 });
    if (res.data?.status !== true) throw new Error(res.data?.message || "Failed to load application setup");
    const freshKey = res.data?.data?.apiKey;
    if (!freshKey) throw new Error("Application API key missing from setup");

    const cached = getApiKey();
    const cachedId = cached ? String(cached).split('.')[0] : null;
    const freshId = String(freshKey).split('.')[0];

    if (!cached || cachedId !== freshId || cached !== freshKey) {
      localStorage.setItem("apiKey", freshKey);
      if (res.data?.data?.keys) setClientKeys(res.data.data.keys);
    }
    return freshKey;
  } catch {
    const cached = getApiKey();
    if (cached) return cached;
    throw new Error("Cannot reach setup endpoint");
  }
}

const authHeaders = (extra = {}) => {
  const headers = { ...extra };
  const token = getToken();
  const apiKey = getApiKey();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
};

function Api(method, url, data, router) {
  return new Promise(function (resolve, reject) {
    axios({
      method,
      url: ConstantsUrl + url,
      data,
      headers: authHeaders(),
    }).then(
      (res) => resolve(res.data),
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("userDetail");
              localStorage.removeItem("token");
              localStorage.removeItem("adminAuth");
              router?.push("/login");
            }
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

function ApiFormData(method, url, data, router) {
  return new Promise(function (resolve, reject) {
    axios({
      method,
      url: ConstantsUrl + url,
      data,
      headers: authHeaders({ "Content-Type": "multipart/form-data" }),
    }).then(
      (res) => resolve(res.data),
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("userDetail");
              router?.push("/");
            }
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

function ApiBlobData(method, url, data, router) {
  return new Promise(function (resolve, reject) {
    axios({
      method,
      url: ConstantsUrl + url,
      data,
      responseType: "blob",
      headers: authHeaders({ "Content-Type": "application/json" }),
    }).then(
      (res) => resolve(res),
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("userDetail");
              router?.push("/");
            }
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

/** Auth + api-users (root paths, not under /api/) */
function AuthApi(method, url, data, router) {
  return new Promise(function (resolve, reject) {
    // /api-users is exempt from X-API-Key; /auth/* still needs it
    const needsApiKey = !String(url).startsWith("api-users");
    const headers = { Authorization: `Bearer ${getToken()}` };
    if (needsApiKey && getApiKey()) {
      headers["X-API-Key"] = getApiKey();
    }

    axios({
      method,
      url: AuthUrl + url,
      data,
      headers,
    }).then(
      (res) => resolve(res.data),
      (err) => {
        if (err.response) {
          if (err?.response?.status === 401 && router) {
            localStorage.removeItem("userDetail");
            localStorage.removeItem("token");
            localStorage.removeItem("adminAuth");
            router.push("/login");
          }
          reject(err.response.data);
        } else {
          reject(err);
        }
      }
    );
  });
}

const timeSince = (date) => {
  date = new Date(date);
  const diff = new Date().valueOf() - date.valueOf();
  const seconds = Math.floor(diff / 1000);
  var interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " Years";
  interval = seconds / 2592000;
  if (interval > 1)
    return Math.floor(interval) + (Math.floor(interval) > 1 ? " Months" : " Month") + " ago";
  interval = seconds / 604800;
  if (interval > 1)
    return Math.floor(interval) + (Math.floor(interval) > 1 ? " Weeks" : " Week") + " ago";
  interval = seconds / 86400;
  if (interval > 1)
    return Math.floor(interval) + (Math.floor(interval) > 1 ? " Days" : " Day") + " ago";
  interval = seconds / 3600;
  if (interval > 1)
    return Math.floor(interval) + (Math.floor(interval) > 1 ? " Hours" : " Hour") + " ago";
  interval = seconds / 60;
  if (interval > 1)
    return Math.floor(interval) + (Math.floor(interval) > 1 ? " Min" : " min") + " ago";
  return "Just now";
};

export {
  Api,
  AuthApi,
  timeSince,
  ApiFormData,
  ApiBlobData,
  ensureApiKey,
  getClientKeys,
  setClientKeys,
  getGoogleMapsKey,
  APP_SETUP_NAME,
};
