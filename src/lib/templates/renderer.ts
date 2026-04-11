import { Agent, WebsiteDraft } from "@prisma/client";

export function renderWebsite(draft: Partial<WebsiteDraft>, agent: Partial<Agent>) {
  return `<!doctype html><html><head><title>${agent.name ?? "Insurance Agent"}</title></head><body><h1>${agent.name ?? "Insurance Agent"}</h1><h2>${draft.headline ?? "Personalized Insurance Guidance"}</h2><p>${draft.aboutText ?? "Helping clients protect what matters most."}</p></body></html>`;
}
