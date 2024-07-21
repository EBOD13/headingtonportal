import React, { useEffect, useState, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import imageList from "./ImageGallery";
import CheckInForm from "./CheckInForm";
import CheckOutForm from './CheckOutForm';
import AddNewGuest from './AddNewGuest';
import AppLogout from './AppLogout';
import { Link } from 'react-router-dom';
import { readSheet} from '../features/sheets/sheetSlice';
import { logout, reset} from '../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { getCheckedInGuests, getAllGuests } from '../features/guests/guestSlice';
import { getAllResidents, } from '../features/residents/residentSlice';
import CountUp from 'react-countup';
import ResidentsRooster from './ResidentsRooster';
import axios, { all } from 'axios';
import { selectActivities } from '../features/activity/activitySlice';

const importAll = (r) => {
  let images = {};
  r.keys().forEach((key) => (images[key] = r(key).default));
  return images;
};

const images = importAll(require.context("../images/icons", false, /\.(png|jpe?g|svg)$/));

const Dashboard = () => {

  const activities = useSelector(selectActivities);
  const [avatarUrls, setAvatarUrls] = useState({});
  const [notice, setNotice] = useState([]);
  const [reducerValue, forceUpdate] = useReducer(x => x +1, 0)
  const [checkedInGuestsCount, setCheckedInGuestsCount] = useState(0);
  const [allGuests, setAllGuests] = useState([]);
  const [allCheckedInGuests, setAllCheckedInGuests] = useState([]);
  const [activityLog, setActivityLog] = useState([]); // Track and log all the checking and checkout activities

  const timerRef = useRef(null);


  
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

  // useSelector hook to extract clerk state from the auth slice
  const {clerk} = useSelector(state => state.auth) /* Checks the clerk property from the auth slice  */
  // const {residents, isLoading, isError, message} = useSelector(state => state.residents)


  // Handles the blurring effect applied on the text
  const [isBlurred, setIsBlurred] = useState(true);

  /* Sets a one minute timer to re-blur everything after a lack of activity*/
  const handleClick = () => {
    clearTimeout(timerRef.current);
    if (!isBlurred) {
      setIsBlurred(true);
    } else {
      setIsBlurred(false);
      timerRef.current = setTimeout(() => {
        setIsBlurred(true);
      }, 60000); // 1 minute = 60000 milliseconds
    }
  };



  useEffect(() => {
    // Clean up the timer when the component unmounts
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!clerk) {
        navigate('/login');
        return;
      }

      try {
        const guestsList = await dispatch(getCheckedInGuests());
        const allGuestsResponse = await dispatch(getAllGuests());

        // Process checked-in guests
        if (guestsList.payload && Array.isArray(guestsList.payload.guests)) {
          const allCheckedInGuestsList = guestsList.payload.guests.map(guest => ({
            name: guest.name,
            room: guest.room,
          }));
          setAllCheckedInGuests(allCheckedInGuestsList);
          setCheckedInGuestsCount(guestsList.payload.count);
        } else {
          console.error('Checked-in guests payload is not an array or does not exist');
        }

        // Process all guests
        if (allGuestsResponse.payload && Array.isArray(allGuestsResponse.payload)) {
          const allGuestsList = allGuestsResponse.payload.map(guest => ({
            name: guest.name,
            flagged: guest.flagged,
          }));
          setAllGuests(allGuestsList);

          // Fetch avatars for each guest
          const avatarPromises = allGuestsList.map(guest =>
            axios.get(`https://ui-avatars.com/api/?background=f4eee0&name=${guest.name}`)
              .then(response => ({ [guest.name]: response.request.responseURL }))
              .catch(error => {
                console.error(`Error fetching avatar for ${guest.name}:`, error);
                return { [guest.name]: '' }; // Return empty string on error
              })
          );

          const avatars = await Promise.all(avatarPromises);
          const avatarUrls = avatars.reduce((acc, curr) => ({ ...acc, ...curr }), {});
          setAvatarUrls(avatarUrls);
        } else {
          console.error('All guests payload is not an array or does not exist');
        }

        forceUpdate(value => value + 1); // Force update the component
      } catch (error) {
        console.error('Error fetching data:', error);
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

    // Function to capitalize the string ( write it as a title with the first letter capitalized)
    const capitalize = (str) =>{
      const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return capitalized
    }

  /* Function to get random images for the guests profile */
  return (
    <AppLogout>
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
          <Link to="/" className="header-link">
            <p>Dashboard</p>
          </Link>
          <a href="card.html" className="profile">
            <img src={imageList["avatar.png"]} className="profile-img" id="user_profile" alt="User Profile" />
          </a>
        </header>
        
      <div className="board">
        <div className="top-container">

            {/* The notice section of the page*/}
            <table className="status-box">
              <thead>
                  <tr>
                      <th>Notice</th>
                  </tr>
              </thead>
              <tbody>
                {/* If the length of the notice is 0, we set a default notice, otherwise, we add more of them*/}
        {notice.length === 0 ? (
          <tr>
            <td style={{ border: '0px solid white' }}> No notice! All good</td>
          </tr>
        ) : (
          notice.filter(n => n).map((n, index) => (
            <tr key={index}>
              <td>{n}</td>
            </tr>
          ))
        )}
      </tbody>
        </table>
      {/* The event section of the page*/}
      <table className="status-box">
              <thead>
                  <tr>
                      <th>Events</th>
                  </tr>
              </thead>
              <tbody>
                <tr >
                  <td>John Doe</td>
                </tr>
              </tbody>
        </table>

{/* Inbox section where we communicate with our supervisors and guests */}
<table className="status-box">
              <thead>
                  <tr>
                      <th>Inbox</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>John Doe</td>
                  </tr>
                  <tr>
                      <td>John Doe</td>
                  </tr>
              </tbody>
        </table>
 {/* Middle Section Container*/}
      </div>
      <div className='middle-container'>
      <table className="large-box">
  <thead>
    <tr>
      <th colSpan="2">Guests in Residence</th> {/* Use colSpan to span both columns */}
    </tr>
  </thead>
  <tbody className={isBlurred ? 'blurry-text' : 'clear-text'} onClick={handleClick}>
    <tr onClick={handleClick}>
    {allCheckedInGuests.map(guest => (
      <tr key={guest.name}>
        <td>{capitalize(guest.name)}</td>
        <td>{capitalize(guest.room)}</td>
      </tr>
))}
    </tr>
  </tbody>
</table>
<table className="status-box">
              <thead>
                  <tr>
                      <th>Activity Log</th>
                  </tr>
              </thead>
              <tbody>
                  {activities.map((activity, index) => (
                    <tr>
                        <td key={index}>{activity}</td>
                        </tr>
                      ))}
                  
                  <tr>
                      <td>John Doe</td>
                  </tr>
              </tbody>
        </table>

        </div>

{/* Lower Section Container*/}
<div className='middle-container'>
<table className="large-box" style={{ height: '5rem' }}>
  <thead>
    <tr>
      <th colSpan="2">Notes</th> {/* Use colSpan to span both columns */}
    </tr>
  </thead>
  <tbody >
    <tr>
    <td colSpan="2">
    <textarea className="full-width-textarea" rows="3" />
      </td>
    </tr>
  </tbody>
</table>
<table className="status-box" style={{ height: '5rem' }}>
              <thead>
                  <tr>
                      <th>Incident</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td>John Doe</td>
                  </tr>
                  <tr>
                      <td>John Doe</td>
                  </tr>
              </tbody>
        </table>

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
              <Link to="/residents_rooster">
                <img src={imageList["residents.svg"]} className="icons" alt="Residents" />
                <p className="nav-text">Residents</p>
              </Link>
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
          <div>

            </div>
            
        </div>
        
    </>
    </AppLogout>
  );
};
export default Dashboard;