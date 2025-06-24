import React, { useState, useEffect } from "react";
import { registerUser } from "../services/auth";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";

// register page component
function RegisterPage() {
  // state to manage the form inputs (name, email, password, and profile image file)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    profile_image: null,
  });
  // state to hold the URL for the local image preview
  const [preview, setPreview] = useState(null);
  // state to manage the loading status to disable the form during submission
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // this effect hook cleans up the object URL created for the image preview
  // it runs when the component unmounts or when the 'preview' state changes
  useEffect(() => {
    return () => {
      if (preview) {
        //revoke the object URL created for the image preview
        //this is to free up memory and prevent memory leaks
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // handles changes for the text input fields
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  //handle image change in the form
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, profile_image: file });
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(URL.createObjectURL(file));
    } else {
      setForm({ ...form, profile_image: null });
      setPreview(null);
    }
  };

  // Handles the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    if (form.profile_image) {
      formData.append("profile_image", form.profile_image);
    }
  
    try {
      //send the form data to the backend by api call with func from auth.js
      await registerUser(formData);
      alert("Registered successfully! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={handleChange}
            name="name"
            className="form-input"
            required
            disabled={isLoading}
          />
        </div>
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

        <div className="mb-4">
          <label className="block mb-1 font-semibold">Upload Profile Image (Optional)</label>
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading} className="form-input-file" />
          
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 w-20 h-20 rounded-full object-cover"
            />
          )}
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? <Spinner /> : "Register"}
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
