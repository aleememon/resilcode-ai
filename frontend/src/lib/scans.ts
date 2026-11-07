const API = process.env.NEXT_PUBLIC_API_URL;

async function post(path: string, init: RequestInit) {
  const res = await fetch(`${API}/api/scans${path}`, {
    ...init,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function uploadProject(file: File) {
  const body = new FormData();
  body.append("file", file); // don't set Content-Type yourself
  return post("/upload", { method: "POST", body });
}

export function importRepo(repoFullName: string, branch: string) {
  return post("/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoFullName, branch }),
  });
}
