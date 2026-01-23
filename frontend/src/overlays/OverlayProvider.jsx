// src/overlays/OverlayProvider.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import CheckInForm from '../components/CheckInForm';
import CheckOutForm from '../components/CheckOutForm';
import AddNewGuest from '../components/AddNewGuest';
import './Overlays.css'; // overlay styling

const OverlayContext = createContext(null);

export const useOverlays = () => {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error('useOverlays must be used within OverlayProvider');
  }
  return ctx;
};

export const OverlayProvider = ({ children }) => {
  const [activeOverlay, setActiveOverlay] = useState(null); 
  // 'checkin' | 'checkout' | 'new-guest' | null

  // Data passed to AddNewGuest (room/host info)
  const [addGuestConfig, setAddGuestConfig] = useState({
    room: '',
    hostId: '',
    hostName: '',
  });

  const closeOverlay = useCallback(() => setActiveOverlay(null), []);

  const openCheckIn = useCallback(() => setActiveOverlay('checkin'), []);
  const openCheckOut = useCallback(() => setActiveOverlay('checkout'), []);

  // Can be called with or without config
  const openAddGuest = useCallback((config) => {
    if (config) {
      setAddGuestConfig({
        room: config.room || '',
        hostId: config.hostId || '',
        hostName: config.hostName || '',
      });
    } else {
      setAddGuestConfig({
        room: '',
        hostId: '',
        hostName: '',
      });
    }
    setActiveOverlay('new-guest');
  }, []);

  const value = {
    activeOverlay,
    openCheckIn,
    openCheckOut,
    openAddGuest,
    closeOverlay,
  };

  return (
    <OverlayContext.Provider value={value}>
      {children}

      {activeOverlay && (
        <div className="overlay-backdrop" onClick={closeOverlay}>
          <div
            className="overlay-panel"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {activeOverlay === 'checkin' && (
              <CheckInForm
                onClose={closeOverlay}
                onAddNewGuest={openAddGuest}
              />
            )}

            {activeOverlay === 'checkout' && (
              <CheckOutForm onClose={closeOverlay} />
            )}

            {activeOverlay === 'new-guest' && (
              <AddNewGuest
                onClose={closeOverlay}
                initialRoom={addGuestConfig.room}
                initialHostId={addGuestConfig.hostId}
                initialHostName={addGuestConfig.hostName}
              />
            )}
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
};
