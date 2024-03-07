import React from 'react';
import './Login.css';
import logo from './images/icons/hh_logo.png'
const Login = () => {
    return (
        <div className="Login">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
                <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap" rel="stylesheet" />
                <link rel="stylesheet" href="styles.css" />
                <title>Login Page</title>
            </head>
            <body>
                <div className="container">
                    <img src={logo} alt="Company Logo" className="center-image" />
                    <h4><i>Log in Portal</i></h4>
                    <form action="#">
                        <label htmlFor="user_id">User ID</label><br />
                        <input type="text" name="user_id" id="user_id" required /><br />
                        <a href="#">Forgot User ID?</a><br />

                        <label htmlFor="password">Password</label><br />
                        <input type="password" name="password" id="password" required /><br />
                        <a href="#">Forgot Password?</a><br />
                        <input type="submit" value="Log in" />
                    </form>
                </div>
            </body>
        </div>
    );
};

export default Login;
