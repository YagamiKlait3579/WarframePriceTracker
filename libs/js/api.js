const API = "/api/v2";

export function createApi({ getSettings }) {
  async function request(path) {
    const settings = getSettings();
    const response = await fetch(`${API}${path}`, {
      headers: {
        Accept: "application/json",
        "X-WFM-Crossplay": settings.crossplay ? "true" : "false",
        "X-WFM-Language": settings.language
      }
    });

    let body = null;
    try { body = await response.json(); } catch {}
    if (!response.ok) {
      const message = body?.error?.request?.join(", ") || body?.error || `HTTP ${response.status}`;
      throw new Error(message);
    }
    if (body?.error) throw new Error(body.error.request?.join(", ") || "API error");
    return body?.data ?? body;
  }

  return {
    getItem(slug) {
      return request(`/items/${encodeURIComponent(slug)}`);
    },
    getTopOrders(slug, rank) {
      const suffix = rank == null ? "" : `?rank=${rank}`;
      return request(`/orders/item/${encodeURIComponent(slug)}/top${suffix}`);
    }
  };
}
