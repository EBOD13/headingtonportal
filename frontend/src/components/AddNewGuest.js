import React, { useEffect, useState } from 'react';
import imageList from './ImageGallery';
import { useDispatch, useSelector } from 'react-redux';
import { registerGuest, resetGuest } from '../features/guests/guestSlice';
import { getResidentByRoom } from '../features/residents/residentSlice';
import { toast } from 'react-hot-toast';
import mongoose from 'mongoose';
import axios from 'axios';

function AddNewGuest() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [hosts, setHosts] = useState([]);
  const [formData, setFormData] = useState({ lastName: '', firstName: '', host: '', contact: '', studentAtOU: '', IDNumber: '', flagged: false, checkIn: '', isCheckedIn: true });
  const { lastName, firstName, host, room, contact, studentAtOU, IDNumber, flagged, checkIn, isCheckedIn } = formData;
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchResidentByRoom = async () => {
      try {
        if (room && room.length === 4) {
          const residents = await dispatch(getResidentByRoom(room.toUpperCase()));
          if (Array.isArray(residents.payload)) {
            const residentsList = residents.payload.map(resident => ({ id: resident._id, name: resident.name }));
            setHosts(residentsList);
          }
        } else {
          setHosts([]);
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };

    fetchResidentByRoom();
  }, [room, dispatch]);

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };

  const toBoolean = (stringValue) => {
    switch (stringValue?.toLowerCase()?.trim()) {
      case 'yes':
        return true;
      case 'no':
        return false;
      default:
        return undefined;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const studentAtOU = toBoolean(formData.studentAtOU);
    const name = `${firstName.toLowerCase()} ${lastName.toLowerCase()}`;
    const selectedHostId = e.target.elements.host.value;
    const hostID = new mongoose.Types.ObjectId(selectedHostId);

    try {
      const number = '+1' + formData.contact;
  
      // Use Axios to make the API request
      const apiKey = '95AHo81aT51ptHSAqYH1vCUemuWJ0kcigTNgQH4s'; // Replace 'YOUR_API_KEY' with your actual API key
      const apiUrl = `https://api.api-ninjas.com/v1/validatephone?number=${number}`;
      const axiosConfig = {
        headers: {
          'X-Api-Key': apiKey
        }
      };
  
      const response = await axios.get(apiUrl, axiosConfig);
      console.log(response.data)
  
      // Check if the number is valid
      if (response.data.is_valid) {
        const guestData = { name, host: hostID, contact: formData.contact, IDNumber, studentAtOU, room:room };
        const registrationResponse = await dispatch(registerGuest(guestData));
        dispatch(resetGuest());
  
        if (registrationResponse?.error?.message === "Rejected") {
          toast.error(registrationResponse.payload);
        } else {
          toast.success(registrationResponse.payload.message);
          setShowOverlay(false);
        }
      } else {
        toast.error('Invalid Phone Number');
      }
    } catch (error) {
      console.error('Error validating phone number or registering guest:', error);
      toast.error('Error validating phone number or registering guest. Please try again later.');
    }
  }

  const closeOverlay = () => {
    setShowOverlay(false);
    window.location.reload();
  };

  return (
    <div>
      {showOverlay && (
        <div className="overlay" id="overlay">
          <div className="form-container">
            <form id="check-in-form" className='checkin-form' onSubmit={onSubmit}>
              <div className="guest-banner">
                <img src={imageList["qr-code.svg"]} alt="QR Code" />
                <h3>Register New Guest</h3>
              </div>
              <div className="form-group">
                <div className="custom-select" style={{ marginLeft: 0 }}>
                  <div className="selected-container">
                    <input name="room" id="room" value={room} onChange={onChange} maxLength="4" placeholder='Select Host' style={{ width: '10rem' }}>
                    </input>
                    <select name="host" id="host">
                      <option value="" disabled selected>Select Host</option>
                      {hosts.map((host) => (
                        <option value={host.id} key={host.id}>{host.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className='guest-profile-box'>
                    <p>Guest's Profile</p>
                    <select className='' name='studentAtOU' id="studentAtOU" onChange={onChange}>
                      <option value="">OU Student?</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    <input type='text' placeholder="Guest's ID Number" className='id-number' name='IDNumber' id='IDNumber' onChange={onChange}></input>
                  </div>
                </div>
              </div>

              <div className='guests-box-container'>
                <input type='text' placeholder="Guest's First Name" id='firstName' name='firstName' value={firstName} onChange={onChange}></input>
                <input type='text' placeholder="Guest's Last Name" id="lastName" name='lastName' value={lastName} onChange={onChange}></input>
              </div>
              <input type="tel" className="guest-contact" placeholder="Guest's Contact" id='contact' name='contact' value={contact} onChange={onChange} maxLength='10'
                onKeyDown={(event) => {
                  // Allow digits, Backspace, and Delete
                  if (!/[0-9]/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Delete') {
                    event.preventDefault();
                  }
                }}/>
              <div className="button-container">
                <button type="button" className="cancel-button" onClick={closeOverlay}>Cancel</button>
                <button type="submit" className="proceed-button">Proceed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddNewGuest;
