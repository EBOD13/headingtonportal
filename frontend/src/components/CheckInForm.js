import React, { useEffect, useState } from 'react';
import imageList from './ImageGallery';
import { toast } from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux';
import { checkInGuest, resetGuest } from '../features/guests/guestSlice'
import { getResidentByRoom, getGuestsByHost } from '../features/residents/residentSlice';
import mongoose from 'mongoose';
import {appendToSheet, readSheet} from '../features/sheets/sheetSlice';
import { selectActivities } from '../features/activity/activitySlice';
import { addActivity } from '../features/activity/activitySlice'; // Import the addActivity action



function CheckInForm() {
  const [columnNames, setColumnNames] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hosts, setHosts] = useState([])
  const [guests, setGuests] = useState([])
  const [formData, setFormData] = useState({ room: '', host: '', guest: '', guestContact: '' })
  const { room, host, contact, guest, guestContact } = formData
  const [selectedHost, setSelectedHost] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Get the time now
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const [sheetFormData, setSheetFormData] = useState({ resident: '', guest: '', room: "", date: '', timeIn:'', timeOut: "" })

  const dispatch = useDispatch()

  // Update the value of our form data and store the name of the guest for future use
  const onChange = e => {
    const { name, value } = e.target;
  
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  
    // If the field updated is 'guest', find and store the selected guest details
    if (name === 'guest') {
      const guestDetails = guests.find(guest => guest.id === value);
      setSelectedGuest(guestDetails); // Store selected guest details
    }
  };
  const onChangeRoom = e => {
    // Reset the host select to its default state
    setFormData(prevState => ({
      ...prevState,
      [e.target.name]: e.target.value,
      host: '',
      guest: '' 
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
    setFormData(prevState => ({
      ...prevState,
      host: selectedHostId // Set the selected host ID
    }));
  
    // Find the selected host from the hosts list
    const hostDetails = hosts.find(host => host.id === selectedHostId);
    setSelectedHost(hostDetails); // Store selected host details
  
    await fetchGuestsByHost(selectedHostId);
  };
  useEffect(() => {
    if (sheetFormData) {
      // Convert sheetFormData to array of arrays
      const formattedData = [
        [
          sheetFormData.resident,
          sheetFormData.guest,
          sheetFormData.room,
          sheetFormData.date,
          sheetFormData.timeIn,
          sheetFormData.timeOut
        ]
      ];

      // Dispatch the formatted data to append to the sheet
      dispatch(appendToSheet({ values: formattedData }));
    }
  }, [sheetFormData, dispatch]);

  
  const onSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const timeIn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const guestId = formData.guest;

    const response = await dispatch(checkInGuest(guestId));
    if (response.error && response.error.message === "Rejected") {
      toast.error("Visitation for this guest has been revoked. \nPlease reach out to the Assistant Director for assistance.");
      setShowOverlay(false);
    } else if (response.meta.requestStatus === 'fulfilled') {
      toast.success("Guest checked in successfully");

      setSheetFormData({
        resident: selectedHost ? selectedHost.name.toLowerCase() : '',
        guest: selectedGuest ? selectedGuest.name : '',
        room: formData.room,
        date: new Date().toLocaleDateString(),
        timeIn: timeIn,
        timeOut: ""
      });
      // Log activity
      dispatch(addActivity(`Checked in: ${selectedGuest ? capitalize(selectedGuest.name) : 'Unknown Guest'} at ${timeIn}`));

      setShowOverlay(false);
    }
    
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
