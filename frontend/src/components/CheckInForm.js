import React, { useEffect, useState } from 'react';
import imageList from './ImageGallery';
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux';
import { checkInGuest, resetGuest } from '../features/guests/guestSlice'
import { getResidentByRoom, getGuestsByHost } from '../features/residents/residentSlice';
import mongoose from 'mongoose';

function CheckInForm() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [hosts, setHosts] = useState([])
  const [guests, setGuests] = useState([])
  const [formData, setFormData] = useState({ room: '', host: '', guest: '', guestContact: '' })
  const { room, host, contact, guest, guestContact } = formData

  const dispatch = useDispatch()

  const onChange = e => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value
    }))
  }
  const onChangeRoom = e => {
    // Reset the host select to its default state
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
      host: '',
      guest: '' // Reset the selected host to empty
    }));
}

  useEffect(() => {
    const fetchResidentByRoom = async () => {
      try {
        if (room && room.length === 4) {
          const residents = await dispatch(getResidentByRoom(room.toUpperCase()));
          if (residents.error) {
            // Check if the response contains an error
            // Handle the 404 error message here
            if (residents.payload === "Request failed with status code 404") {
              // Handle the 404 error message
              toast.error("No residents found for this room.");
            }
          } else {
            // No error, proceed with setting the hosts
            const residentsList = residents.payload.map(resident => ({ id: resident._id, name: resident.name }));
            setHosts(residentsList);
          }         
        } else {
          setHosts([]);
          setGuests([]);
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };
  
    fetchResidentByRoom();
  }, [room, dispatch]);
  


  const fetchGuestsByHost = async (hostId) =>{
    try{
      const response = await dispatch(getGuestsByHost(hostId));
      setGuests(response.payload.guestNames)
    }
    catch (error){
      console.error('Error fetching guests by host:', error);
    }
  }
  const onHostSelect = async (e) => {
    const selectedHostId = e.target.value;
    setFormData((prevState) => ({
        ...prevState,
        host: selectedHostId // Set the selected host ID
    }));
    await fetchGuestsByHost(selectedHostId);
};

const onSubmit = async (e) => {
  e.preventDefault();

  // Ensure formData.guest has the correct guestId
  const guestId = formData.guest; // Assuming guest is already the ID
  // Dispatch checkInGuest action with guestId
  const response = await dispatch(checkInGuest(guestId));
  if (response.meta.requestStatus === 'fulfilled')
  toast.success("Guest checked in successfully")
  setShowOverlay(false)
};


  const capitalize = (str) =>{
    const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return capitalized
  }
  const closeOverlay = () => {
    setShowOverlay(false);
  };
  return (
    <div>
      {showOverlay && (
        <div className="overlay" id="overlay">
          <div className="form-container">
            <form id="check-in-form" className='checkin-form' onSubmit={onSubmit}>
              <div className="guest-banner">
                <img src={imageList["qr-code.svg"]} alt="QR Code" />
                <h3>Guest Check-In</h3>
              </div>
              <div className="form-group">
                <div className="custom-select">
                  <div className="selected-container">
                    <input name="room" value={room} id="room" maxLength="4" style={{ width: '10rem' }} onChange={onChangeRoom} placeholder='Type Host Room'/>
                    <select name="host" id="host" value={host} onChange={onHostSelect}>
                      <option value="" disabled>Select Host</option>
                      {hosts.map((host) => (
                          <option value={host.id} key={host.id}>{host.name}</option>
                      ))}
                  </select>

                  </div>
                  <select name="guest" id="guest" className="unique-select" value={guest} onChange={onChange}>
                  <option value="" disabled selected>Select Guest</option>
                      {guests.map((guest) => (
                        <option style={{textTransform: 'capitalize'}} value={guest.id} key={guest.value}>{capitalize(guest.name)}</option>
                      ))}
                  </select>
                </div>
              </div>
                 <div className="button-container">
                <button type="button" className="cancel-button" onClick={closeOverlay}>Cancel</button>
                <button type="submit" className="proceed-button">Check-In</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
};


export default CheckInForm;
