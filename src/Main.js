import React from "react";
import "./Main.css";
import imageList from "./ImageGallery";


// Import all images from the icons folder dynamically
const importAll = (r) => {
  let images = {};
  r.keys().forEach((key) => (images[key] = r(key).default));
  return images;
};

const images = importAll(require.context("./images/icons", false, /\.(png|jpe?g|svg)$/));

const Main = () => {
  return (
    <>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
        <script src="https://kit.fontawesome.com/f17c0b25f8.js" crossorigin="anonymous"></script>

        <title>University of Oklahoma Dashboard</title>
        <link rel="stylesheet" href="styles.css" />
      </head>
      <body>
        <header className="menu-bar">
          <a href="" className="header-link">
            <p>Dashboard</p>
          </a>
          <a href="card.html" className="profile">
            <img src={imageList["avatar.png"]} className="profile-img" id="user_profile" />
          </a>
        </header>
        <div className="header">
            <div className="box-container">
                <div class="status-box"><p className="banner-text">Current Guest - North</p>
                <br/><p className="guests-numbers">13</p></div>
                <div class="status-box"><p className="banner-text">Current Guest - South</p>
                <br/><p className="guests-numbers">11</p></div>
                <div class="status-box"><p className="banner-text">Daily Guests</p>
                <br/><p className="guests-numbers">32</p></div>
            </div>

          <div className="side-nav">
            <a href="#" className="logo">
              <img src={imageList["OU_Banner.png"]} className="logo-img" />
              <img src="hh_logo.png" className="logo-icon" />
            </a>
            <p className="logo-text">
              <strong>HEADINGTON</strong>
              <br />
              HALL
            </p>
            <ul className="nav-links">
              <li>
                <a href="card.html">
                  <img src={imageList["check-in.svg"]} className="icons" />
                  <p className="nav-text">Check In</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["check-out.svg"]} className="icons" />
                  <p className="nav-text">Check Out</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["new-user.svg"]} className="icons" />
                  <p className="nav-text"> New Guest</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["residents.svg"]} className="icons" />
                  <p className="nav-text">Residents</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["guests.svg"]} className="icons" />
                  <p className="nav-text">Guests</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["blacklist.svg"]} className="icons" />
                  <p className="nav-text">Blacklist</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["settings.svg"]} className="icons" />
                  <p className="nav-text">Settings</p>
                </a>
              </li>
              <li className="log-out">
                <a href="#">
                  <img src={imageList["door.svg"]} className="icons" />
                  <p className="nav-text">Log out</p>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </body>
    </>
  );
};

export default Main;
