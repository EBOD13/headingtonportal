import React, { useEffect, useState } from 'react';
import imageList from './ImageGallery';
import { useDispatch, useSelector } from 'react-redux';
import {registerGuest, resetGuest} from '../features/guests/guestSlice'
import { getResidentByRoom } from '../features/residents/residentSlice';
import { toast } from 'react-hot-toast'
import mongoose from 'mongoose';

function AddNewGuest() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [hosts, setHosts] = useState([])
  const [formData, setFormData] = useState({lastName:'', firstName:'', host:'', contact:'', studentAtOU:'', IDNumber:'', flagged: false, checkIn:'', isCheckedIn: true})
  let {lastName, firstName, host, room, contact, studentAtOU, IDNumber, flagged, checkIn, isCheckedIn } = formData
  const dispatch = useDispatch()
  
  useEffect(() => {
    const fetchResidentByRoom = async () => {
      try {
        if (room && room.length === 4) { // Only fetch residents if a room is selected
          const residents = await dispatch(getResidentByRoom(room.toUpperCase()));
          if (Array.isArray(residents.payload)) { // Check if residents.payload is an array
            const residentsList = residents.payload.map(resident => ({ id: resident._id, name: resident.name }));
            setHosts(residentsList);
          } 
        } else {
          setHosts([]); // Clear hosts if no room is selected
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };
  
    fetchResidentByRoom();
  }, [room, dispatch]);
  
  
  const onChangeContact = e => {
    const guestContact = e.target.value;
    let formattedContact = guestContact; // Default to the input value
  
    // Check if the input value contains digits
    if (/^\d+$/.test(guestContact)) {
      // Format the contact number if it contains 10 digits
      if (guestContact.length === 10) {
        const areaCode = guestContact.slice(0, 3);
        const middleDigits = guestContact.slice(3, 6);
        const lastDigits = guestContact.slice(6);
        formattedContact = `${areaCode}-${middleDigits}-${lastDigits}`;
      }
    }
  
    // Update the formData state with the formatted contact
    setFormData(prevState => ({
      ...prevState,
      contact: formattedContact
    }));
  };
  
  
  const onChange = e =>{
    setFormData(prevState =>({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  }

  const toBoolean = (stringValue) =>{
    switch(stringValue?.toLowerCase()?.trim()){
      case 'yes':
        return true;
      case 'no':
        return false
    }
  }
  const onSubmit = async (e) => {
    e.preventDefault();
    const studentAtOU = toBoolean(formData.studentAtOU);
    const name = firstName.toLowerCase() + " " + lastName.toLowerCase();
    const selectedHostId = e.target.elements.host.value;
    const hostID = new mongoose.Types.ObjectId(selectedHostId);

    const guestData = { name, host:hostID, contact: formData.contact, IDNumber, studentAtOU };
  
    try {
      const response = await dispatch(registerGuest(guestData));
      dispatch(resetGuest())
     
      // Check for specific error message
      if (response?.error?.message === "Rejected") {
        // Show error message to the user
        toast.error(response.payload)
        // You can use react-hot-toast or any other method to display the message
        // toast.error("Guest already exists. Please enter different details.");
      }
      else{
        toast.success(response.payload.message)
        setShowOverlay(false)
      }
    } catch (error) {
      console.error('Error registering guest:', error);
      // Handle other errors here if needed
    }

  };
  
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
                    <input name="room" id="room" value={room} onChange={onChange} maxlength="4" placeholder='Select Host' style={{ width: '10rem' }}>
                    </input>
                    <select name="host" id="host" >
                    <option value="" disabled selected>Select Host</option>
                    {hosts.map((host) => (
                      <option value={host.id} key={host.id}>{host.name}</option>
                    ))}
                  </select>
                  </div>
                 <div className='guest-profile-box'>
                   <p> Guest's Profile</p>
                   <select className='' name='studentAtOU' id="studentAtOU" onChange={onChange}>
                     <option value=""> OU Student? </option>
                     <option value="yes"> Yes </option>
                     <option value="no"> No </option>
                   </select>
                   <input type='text' placeholder="Guest's ID Number" className='id-number' name='IDNumber' id='IDNumber' onChange={onChange}></input>
                 </div>
                </div>
              </div>

              <div className='guests-box-container'>
                
                <input type='text' placeholder="Guest's First Name" id='firstName' name='firstName' value={firstName} onChange={onChange}></input>
                <input type='text' placeholder="Guest's Last Name" id="lastName" name='lastName' value={lastName} onChange={onChange}></input>
              </div>
              <input type="text" className="guest-contact" placeholder="Guest's Contact" id='contact' name='contact' value={contact} onChange={onChangeContact} maxLength='12'
              onKeyPress={(event) =>{
                if(!/[0-9]/.test(event.key)){
                  event.preventDefault();
                }
              }}/>
              <div className="button-container">
                <button type="button" className="cancel-button" onClick={closeOverlay}>Cancel</button>
                <button type="submit" className="proceed-button" >Proceed</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddNewGuest;
