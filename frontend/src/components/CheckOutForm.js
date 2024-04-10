import React, { useState, useEffect } from 'react';
import imageList from './ImageGallery';
import { useDispatch} from 'react-redux';
import { toast } from 'react-hot-toast'
import { getResidentByRoom, getGuestsByHost } from '../features/residents/residentSlice';
import { checkOutGuest, getCheckedInGuests, resetGuest } from '../features/guests/guestSlice';

function CheckOutForm() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [formData, setFormData] = useState({ guest: ''});
  const [guests, setGuests] = useState([]); // Fix here
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchGuests = async() => {
      try {
        const guestsIn = await dispatch(getCheckedInGuests());
        const guestList = guestsIn.payload.guests.map(guest => ({ id: guest._id, name: guest.name }));
        setGuests(guestList); // Update state here
      } catch(error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchGuests();
  }, [dispatch]);

  const closeOverlay = () => {
    setShowOverlay(false);
  };

  const capitalize = (str) =>{
    const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return capitalized
  }
  const onChange = e => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
const onSubmit = async (e) =>{
  e.preventDefault();
  const guestId = formData.guest
  
  const response = await dispatch(checkOutGuest(guestId));
  if (response.meta.requestStatus === 'fulfilled')
  toast.success("Guest checked out successfully")
  setShowOverlay(false)
}
  return (
    <div>
      {showOverlay && (
        <div className="overlay" id="overlay">
          <div className="form-container">
            <form id="check-in-form" onSubmit={onSubmit} className='checkout-form'>
              <div className="guest-banner">
                <img src={imageList["qr-code.svg"]} alt="QR Code" />
                <h3>Guest Check-Out</h3>
              </div>
              <div className="form-group">
                <div className="custom-select">
                  <div className="selected-container">
                  <select name="guest" id="guest" style={{ width: "17rem" }} value={formData.guest} onChange={onChange}>
                  <option value="" disabled selected>Select Guest</option>
  {guests.map((guest) => (
    <option value={guest.id} key={guest.id}>{capitalize(guest.name)}</option>
  ))}
</select>

                  </div>
                </div>
              </div>
              <div className="button-container">
                <button type="button" className="cancel-button" onClick={closeOverlay} style={{ width: " 7rem"}}>Cancel</button>
                <button type="submit" className="proceed-button" style={{ width: " 8rem"}}>Check-Out</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckOutForm;

