const BASE_URL = import.meta.env.VITE_BASE_URL_SERVER || 'http://127.0.0.1:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function registerUser(formData) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorResult = await res.json().catch(() => {
      throw new Error("Invalid response from server on error");
    });
    throw new Error(errorResult.error || "Registration failed");
  }

  return res.json().catch(() => {
    throw new Error("Invalid response from server on success");
  });
}

async function loginUser(credentials) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorResult = await res.json().catch(() => {
      throw new Error("Invalid response from server on error");
    });
    throw new Error(errorResult.error || "Login failed");
  }

  const result = await res.json().catch(() => {
    throw new Error("Invalid response from server on success");
  });

  if (result.access_token) {
    localStorage.setItem("token", result.access_token);
  }
  return result;
}

async function getProfile() {
  const res = await fetch(`${BASE_URL}/user/profile`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

async function logoutUser() {
  localStorage.removeItem("token");
}

export { registerUser, loginUser, getProfile, logoutUser };