import { API_BASE_URL } from "../services/api";

const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
};

export const resolveImageUrl = (image) => {
  const raw =
    typeof image === "string"
      ? image
      : image?.image_url || image?.url || image?.image_path || image?.path || "";

  if (!raw) return "";
  if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;

  const apiOrigin = getApiOrigin();

  if (raw.startsWith("/uploads/")) {
    return `${apiOrigin}${raw}`;
  }

  try {
    const url = new URL(raw);

    if (
      url.pathname.startsWith("/uploads/") &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    ) {
      return `${apiOrigin}${url.pathname}`;
    }

    return url.href;
  } catch {
    return raw;
  }
};
