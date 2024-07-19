import React, { useEffect, useState, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import imageList from "./ImageGallery";
import CheckInForm from "./CheckInForm";
import CheckOutForm from './CheckOutForm';
import AddNewGuest from './AddNewGuest';
import AppLogout from './AppLogout';
import { Link } from 'react-router-dom';
import { logout, reset} from '../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { getCheckedInGuests, resetGuest, } from '../features/guests/guestSlice';
import { getAllResidents, } from '../features/residents/residentSlice';
import CountUp from 'react-countup';


const importAll = (r) => {
  let images = {};
  r.keys().forEach((key) => (images[key] = r(key).default));
  return images;
};

const images = importAll(require.context("../images/icons", false, /\.(png|jpe?g|svg)$/));

const ResidentsRooster = () => {

  const [reducerValue, forceUpdate] = useReducer(x => x +1, 0)
  const [allResidents, setAllResidents] = useState([]);
  const logoutFn = () => {
    dispatch(logout())
    dispatch(reset())
    navigate('/')
}

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // useSelector hook to extract clerk state from the auth slice
  const {clerk} = useSelector(state => state.auth) /* Checks the clerk property from the auth slice  */
  // const {residents, isLoading, isError, message} = useSelector(state => state.residents)


  useEffect(() => {
    /* This part of the code helps with fetching the information that we need to allow the clerk nto work normally. That is, if the clear is not logged in, we redirect them ton the login page */
    const fetchData = async () => {
      if (!clerk) { // If clerk is not available
        navigate('/login'); // Navigate to the login page 
        return; // Exit early if clerk is not available
      }
      // Otherwise, if the clerk is checked in, we perform other operations
      try {
        const residentsListIn = await dispatch(getAllResidents());
        if (residentsListIn.payload && Array.isArray(residentsListIn.payload)) {
            const residentsList = residentsListIn.payload.map(resident => ({
              id: resident._id,
              name: resident.name,
              room: resident.roomNumber,
            }));
            setAllResidents(residentsList);
          }
          else {
            console.error('Payload is not an array or does not exist');
          }
 // Check what is stored in allResidents

        forceUpdate(); // Force update the component so that we avoid having errors along the way as we load the count
      } catch (error) {
        console.error('Error fetching checked-in guests:', error); // Log any errors that occur during fetching
      }
    };

    fetchData();


  }, [clerk, navigate, dispatch, reducerValue]);

  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);
  const [showAddNewGuest, setShowAddNewGuest] = useState(false);
  
  const capitalize = (str) =>{
    const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return capitalized
  }
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
          <a className="header-link">
            <p>Residents Rooster</p>
          </a>
          <a href="card.html" className="profile">
            <img src={imageList["avatar.png"]} className="profile-img" id="user_profile" alt="User Profile" />
          </a>
        </header>
        
      <div className="board">
          <div className="side-nav">
            <Link to="/" className="logo">
              <img src={imageList["OU_Banner.png"]} className="logo-img" alt="OU Banner" />
              <img src="hh_logo.png" className="logo-icon" alt="HH Logo" />
            </Link>
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




<div className="residents-container">
  <table className="resident-rooster">
    <thead>
      <tr>
        <th>North Wing</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="north">
          <div className="scrollable">
            {allResidents
              .filter(resident => resident.room.startsWith("N"))
              .map(resident => (
                <a href="#" className="resident-link" key={resident.id}>
                  <table className="resident-table">
                    <tbody>
                      <tr>
                        <td className="resident-profile">
                          <img src="man.jpg" className="resident-image" alt="Resident" />
                        </td>
                        <td className="resident-name">{capitalize(resident.name)}</td>
                        <td className="resident-room">{resident.room}</td>
                      </tr>
                    </tbody>
                  </table>
                </a>
              ))}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  
  <div className="middle-text" rowSpan={allResidents.filter(resident => resident.room.startsWith("N")).length + 2}>
          {Array.from("HEADINGTON HALL").map((letter, index) => (
            <div key={index}>{letter}</div>
          ))}
 </div>
  <table className="resident-rooster">
    <thead>
      <tr>
        <th>South Wing</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="south">
          <div className="scrollable">
            {allResidents
              .filter(resident => resident.room.startsWith("S"))
              .map(resident => (
                <a href="#" className="resident-link" key={resident.id}>
                  <table className="resident-table">
                    <tbody>
                      <tr>
                        <td className="resident-profile">
                          <img src="man.jpg" className="resident-image" alt="Resident" />
                        </td>
                        <td className="resident-name">{capitalize(resident.name)}</td>
                        <td className="resident-room">{resident.room}</td>
                      </tr>
                    </tbody>
                  </table>
                </a>
              ))}
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
</div>
</div>
    </>
    </AppLogout>
  );
};
export default ResidentsRooster;