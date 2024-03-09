import React, { useState } from 'react';
import './CheckInForm.css'; // Import your CSS file here
import imageList from './ImageGallery';

function CheckInForm() {
  const [showOverlay, setShowOverlay] = useState(false);

  const openOverlay = () => {
    setShowOverlay(true);
  };

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  return (
    <div>
      <button className="open-btn" onClick={openOverlay}>Open Form</button>

      {showOverlay && (
        <div className="overlay" id="overlay">
          <div className="form-container">
            <form id="check-in-form">
              <div className="guest-banner">
                <img src={imageList["qr-code.svg"]} alt="QR Code" />
                <h3>Guest Check-In</h3>
              </div>
              <div className="form-group">
                <div className="custom-select">
                  <div className="selected-container">
                    <select name="room" id="room">
                      <option value=""> Select Host Room</option>
                      <option value="room1">Room 1</option>
                      <option value="room2">Room 2</option>
                      <option value="room3">Room 3</option>
                    </select>
                    <select name="host" id="host">
                      <option value="">Select Host</option>
                      <option value="room1">James Jackson</option>
                      <option value="room2">Emma Riffe</option>
                      <option value="room3">Tony Ursula</option>
                    </select>
                  </div>
                  <select name="guest" id="guest" className="unique-select">
                    <option value=""> Select Guest </option>
                    <option value="room1">Patrique Flies</option>
                    <option value="room2">Enrique Gustovar</option>
                    <option value="room3">Rafael Kindoka</option>
                  </select>
                </div>
              </div>
              <input type="text" name="guest-contact" className="guest-contact" />
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

export default CheckInForm;
