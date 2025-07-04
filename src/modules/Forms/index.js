import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Input = ({ label, onChange, placeholder, name, className, value }) => (
  <div className={`mb-6 ${className}`}>
    <label className="block text-sm font-medium text-yellow-300 mb-2">{label}</label>
    <input
      type="text"
      onChange={onChange}
      placeholder={placeholder}
      name={name}
      value={value}
      className="w-full px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
    />
  </div>
);

const Button = ({ type, label, className }) => (
  <button
    type={type}
    className={`w-full py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition duration-300 ${className}`}
  >
    {label}
  </button>
);

const Form = ({ isSingInPage = true }) => {
  const [data, setData] = useState({
    ...(!isSingInPage && { fullName: "" }),
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Data being sent:", data);

    try {
      const res = await fetch(
        `https://chat-server-vi4d.onrender.com/api/${isSingInPage ? "login" : "register"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (res.status === 400) {
        alert("Invalid credentials");
        return;
      }
      if (res.status === 500) {
        const errorData = await res.json();
        alert(errorData.error || "A server error occurred. Please try again.");
        return;
      }

      const resData = await res.json();
      console.log("Response data:", resData);

      if (!isSingInPage) {
        if (res.ok) {
          alert("Registered successfully! Please sign in.");
          navigate("/users/sign_in");
        } else {
          console.error("Registration failed:", resData);
          alert(resData.message || "Registration failed. Please try again.");
        }
        return;
      }

      if (resData.token && resData.User) {
        const userDetails = {
          id: resData.User.id,
          email: resData.User.email,
          fullName: resData.User.fullName,
        };

        localStorage.setItem("user:token", resData.token);
        localStorage.setItem("user:details", JSON.stringify(userDetails));

        console.log("Login successful! Redirecting...");
        navigate("/");
      } else {
        console.error("Login response is missing necessary fields:", resData);
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error during login/registration fetch:", error.message);
      alert("An error occurred. Please check your network and try again.");
    }
  };

  return (
    <div
      className="relative w-full  min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('https://media.istockphoto.com/id/468756992/photo/night-sky-with-stars-and-blue-nebula-over-water.jpg?s=612x612&w=0&k=20&c=7l7orITTtsTp3iUtAPESp1-RC4wtC17Fa-QbpthfVzI=')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gray-900 bg-opacity-70 p-10 rounded-xl shadow-2xl w-full max-w-md z-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-yellow-300 mb-2">
            Welcome {isSingInPage && "back"}
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            {isSingInPage ? "Sign in to explore" : "Sign up now to get started"}
          </p>
        </div>
        <form
          className="flex flex-col items-center w-full"
          onSubmit={handleSubmit}
        >
          {!isSingInPage && (
            <Input
              label="Full Name"
              onChange={(e) => setData({ ...data, fullName: e.target.value })}
              placeholder="Enter your full name"
              name="name"
              className="mb-6"
              value={data.fullName}
            />
          )}
          <Input
            label="Email"
            onChange={(e) => setData({ ...data, email: e.target.value })}
            placeholder="Enter your email"
            name="email"
            className="mb-6"
            value={data.email}
          />
          <Input
            label="Password"
            onChange={(e) => setData({ ...data, password: e.target.value })}
            placeholder="Enter your password"
            name="password"
            className="mb-8"
            value={data.password}
          />

          <Button
            type="submit"
            label={isSingInPage ? "Sign In" : "Sign Up"}
            className="mb-6"
          />
        </form>

        <div className="text-center text-gray-400">
          {isSingInPage ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() =>
              navigate(`/${isSingInPage ? "users/sign_up" : "users/sign_in"}`)
            }
            className="cursor-pointer text-yellow-300 hover:text-yellow-200 underline"
          >
            {isSingInPage ? "Sign up" : "Sign in"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Form;