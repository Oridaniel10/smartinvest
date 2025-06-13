import React, { useState } from "react";
import { loginUser } from "../services/auth";
import { useNavigate } from "react-router-dom";
import WelcomePopup from "../components/WelcomePopup";
import Spinner from "../components/Spinner"; 
import { useAuth } from "../context/AuthContext";

// login page component
function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null); // state for the welcome popup
  const navigate = useNavigate();
  const { login } = useAuth(); // Get the login function from our context

  // handles changes for the text input fields
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // attempt to log in the user with the provided credentials
      const result = await loginUser(form);
      
      // Use the login function from AuthContext to set the user and token
      login(result.user, result.access_token);

      // show welcome popup with user data
      setWelcomeUser(result.user);

      // after a delay , navigate to the profile page
      setTimeout(() => {
        navigate("/profile");
      }, 3000); // 3-second delay
    } catch (err) {
      alert(err.message || "Login failed");
      setIsLoading(false); // stop loading on error
    } 
    // we don't set isLoading to false on success because we navigate away
  };

  return (
    <div className="form-container relative">
      {/* show the welcome popup when a user successfully logs in */}
      <WelcomePopup user={welcomeUser} />

      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange}
            name="email"
            className="form-input"
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={handleChange}
            name="password"
            className="form-input"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? <Spinner /> : "Login"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
