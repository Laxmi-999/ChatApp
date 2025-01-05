import React, { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

const Form = ({ isSingInPage = true }) => {
    const [data, setData] = useState({
        ...(!isSingInPage && {
            fullName: '',
        }),
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`http://localhost:8000/api/${isSingInPage ? 'login' : 'register'}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (res.status === 400) {
                alert('Invalid credentials');
                return;
            }

            const resData = await res.json();
           console.log('login details', resData);
            // Check if the response contains the token and user details
            if (resData.token && resData.User) {
                const userDetails = {
                    id: resData.User.id, // Ensure we have a user ID
                    email: resData.User.email,
                    fullName: resData.User.fullName,
                };

                // Save user details and token to localStorage
                localStorage.setItem('user:token', resData.token);
                localStorage.setItem('user:details', JSON.stringify(userDetails));

                console.log('Login successful! Redirecting...');
                navigate('/'); // Redirect to the homepage after login
            } else {
                console.error('Login response is missing necessary fields:', resData);
                alert('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            alert('An error occurred during login. Please try again.');
        }
    };

    return (
        <>
            <div className="text-yellow bg-white h-[800px] w-[600px] shadow-lg rounded-lg items-center flex flex-col justify-center">
                <div className="text-4xl font-extrabold">
                    Welcome {isSingInPage && 'back'}
                </div>
                <div className="text-xl font-light mb-14">
                    {isSingInPage ? 'Sign in to explore' : 'Sign up now to get started'}
                </div>
                <form
                    className="justify-center flex flex-col items-center w-full"
                    onSubmit={handleSubmit}
                >
                    {!isSingInPage && (
                        <Input
                            label="Full Name"
                            onChange={(e) => setData({ ...data, fullName: e.target.value })}
                            placeholder="Enter your full name"
                            name="name"
                            className="mb-10"
                            value={data.fullName}
                        />
                    )}
                    <Input
                        label="Email"
                        onChange={(e) => setData({ ...data, email: e.target.value })}
                        placeholder="Enter your email"
                        name="email"
                        className=""
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
                        label={isSingInPage ? 'Sign In' : 'Sign Up'}
                        className="shadow-lg w-1/2 mb-2 mt-10"
                    />
                </form>

                <div>
                    {isSingInPage ? 'Did not have an account?' : 'Already have an account?'}{' '}
                    <span
                        onClick={() => navigate(`/${isSingInPage ? 'users/sign_up' : 'users/sign_in'}`)}
                        className="cursor-pointer text-blue underline"
                    >
                        {isSingInPage ? 'Sign up' : 'Sign in'}
                    </span>
                </div>
            </div>
        </>
    );
};

export default Form;
