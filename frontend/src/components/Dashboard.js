import React, { useEffect, useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import imageList from "./ImageGallery";
import CheckInForm from "./CheckInForm";
import CheckOutForm from './CheckOutForm';
import AddNewGuest from './AddNewGuest';
import { logout, reset } from '../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { getCheckedInGuests, resetGuest } from '../features/guests/guestSlice';
import CountUp from 'react-countup';



const importAll = (r) => {
  let images = {};
  r.keys().forEach((key) => (images[key] = r(key).default));
  return images;
};

const images = importAll(require.context("../images/icons", false, /\.(png|jpe?g|svg)$/));

const Dashboard = () => {

  const [reducerValue, forceUpdate] = useReducer(x => x +1, 0)
  const [checkedInGuestsCount, setCheckedInGuestsCount] = useState(0);
  const logoutFn = () => {
    dispatch(logout())
    dispatch(reset())
    navigate('/')
}
const animationConfig ={
  delay: 1000,
  duration: 3,
  easing: 'easeOutCubic'
}
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const {clerk} = useSelector(state => state.auth)


  useEffect(() => {
    const fetchData = async () => {
      if (!clerk) {
        navigate('/login');
        return; // Exit early if clerk is not available
      }

      try {
        const guestsList = await dispatch(getCheckedInGuests());
        setCheckedInGuestsCount(guestsList.payload.count);
        forceUpdate();
      } catch (error) {
        console.error('Error fetching checked-in guests:', error);
      }
    };

    fetchData();


  }, [clerk, navigate, dispatch, reducerValue]);

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);
  const [showAddNewGuest, setShowAddNewGuest] = useState(false);
  
  const toggleCheckInForm = () => {
    setShowCheckInForm(prevState => !prevState);
  };

  const toggleCheckOutForm = () => {
    setShowCheckOutForm(prevState => !prevState);
  };

  const toggleAddNewGuest = () => {
    setShowAddNewGuest(prevState => !prevState);
  };

  const handleCheckInFormLinkClick = (event) => {
    event.preventDefault(); 
    toggleCheckInForm();
  };
  
  const handleCheckOutFormLinkClick = (event) => {
    event.preventDefault(); 
    toggleCheckOutForm();
  };
  
  const handleAddNewGuestLinkClick = (event) => {
    event.preventDefault(); 
    toggleAddNewGuest();
  };
  
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
     
        <header className="menu-bar">
          <a href="#" className="header-link">
            <p>Dashboard</p>
          </a>
          <a href="card.html" className="profile">
            <img src={imageList["avatar.png"]} className="profile-img" id="user_profile" alt="User Profile" />
          </a>
        </header>
        
      <div className="board">
            <div className="box-container">
                <div className="status-box"><p className="banner-text">North Guests</p>
                <br/><p className="guests-numbers">13</p></div>
                <div className="status-box"><p className="banner-text">South Guests</p>
                <br/><p className="guests-numbers">11</p></div>
                <div className="status-box"><p className="banner-text">Current Guests</p>
                <br/>
                <p className="guests-numbers"><CountUp duration={1.5} start={0} end={checkedInGuestsCount}/>
                </p></div>
            </div>

          <div className="side-nav">
            <a href="#" className="logo">
              <img src={imageList["OU_Banner.png"]} className="logo-img" alt="OU Banner" />
              <img src="hh_logo.png" className="logo-icon" alt="HH Logo" />
            </a>
            <p className="logo-text">
              <strong>HEADINGTON</strong>
              <br />
              HALL
            </p>
            <ul className="nav-links">
              <li>  
                <a onClick={handleCheckInFormLinkClick}>
                  <img src={imageList["check-in.svg"]} className="icons" alt="Check In" />
                  <p className="nav-text">Check In</p>
                </a>
                {showCheckInForm && <CheckInForm onClose={toggleCheckInForm} />}
              </li>
              <li>
                <a  onClick={handleCheckOutFormLinkClick}>
                  <img src={imageList["check-out.svg"]} className="icons" alt="Check Out" />
                  <p className="nav-text">Check Out</p>
                </a>
                {showCheckOutForm && <CheckOutForm onClose={toggleCheckOutForm} />}
              </li>
              <li>
                <a onClick={handleAddNewGuestLinkClick}>
                  <img src={imageList["new-user.svg"]} className="icons" alt="New Guest" />
                  <p className="nav-text"> New Guest</p>
                </a>
                {showAddNewGuest && <AddNewGuest onClose={toggleAddNewGuest} />}
              </li>
              <li>
                <a href="#">
                  <img src={imageList["residents.svg"]} className="icons" alt="Residents" />
                  <p className="nav-text">Residents</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["guests.svg"]} className="icons" alt="Guests" />
                  <p className="nav-text">Guests</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["blacklist.svg"]} className="icons" alt="Blacklist" />
                  <p className="nav-text">Blacklist</p>
                </a>
              </li>
              <li>
                <a href="#">
                  <img src={imageList["settings.svg"]} className="icons" alt="Settings" />
                  <p className="nav-text">Settings</p>
                </a>
              </li>
              <li className="log-out">
                <a href="#" onClick={logoutFn}>
                  <img src={imageList["door.svg"]} className="icons" alt="Log Out" />
                  <p className="nav-text">Log out</p>
                </a>
              </li>
            </ul>

          </div>
        </div>
    </>
  );
};
export default Dashboard;