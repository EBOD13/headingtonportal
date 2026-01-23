// frontend/src/components/RoomSelector.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Building, DoorOpen } from 'lucide-react';

const RoomSelector = ({ onSelectRoom, disabled = false, initialRoom = '' }) => {
    const [inputValue, setInputValue] = useState(initialRoom);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [recentRooms, setRecentRooms] = useState([]);
    const [wings, setWings] = useState({ north: [], south: [] });
    const inputRef = useRef(null);

    // Load recent rooms from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recent_rooms');
        if (saved) {
            setRecentRooms(JSON.parse(saved));
        }
    }, []);

    // Load wing data (you would fetch this from your API)
    useEffect(() => {
        // Mock data - replace with actual API call
        const mockWings = {
            north: ['N101', 'N102', 'N103', 'N104', 'N105'],
            south: ['S101', 'S102', 'S103', 'S104', 'S105']
        };
        setWings(mockWings);
    }, []);

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase();
        setInputValue(value);
        
        if (value.length >= 1) {
            // Filter suggestions
            const allRooms = [...wings.north, ...wings.south, ...recentRooms];
            const filtered = allRooms.filter(room => 
                room.includes(value)
            ).slice(0, 10);
            
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    };

    // Handle room selection
    const handleSelectRoom = (room) => {
        setInputValue(room);
        setShowSuggestions(false);
        
        // Update recent rooms
        const updatedRecent = [room, ...recentRooms.filter(r => r !== room)].slice(0, 5);
        setRecentRooms(updatedRecent);
        localStorage.setItem('recent_rooms', JSON.stringify(updatedRecent));
        
        // Call parent callback
        if (onSelectRoom) {
            onSelectRoom(room);
        }
    };

    // Handle manual entry (Enter key)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            handleSelectRoom(inputValue);
        }
    };

    // Clear input
    const handleClear = () => {
        setInputValue('');
        setShowSuggestions(false);
        if (onSelectRoom) {
            onSelectRoom('');
        }
    };

    // Get wing color
    const getWingColor = (room) => {
        if (room.startsWith('N')) return 'bg-blue-100 text-blue-800';
        if (room.startsWith('S')) return 'bg-pink-100 text-pink-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <div className="flex items-center border-2 border-gray-300 rounded-lg focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-200 transition-all duration-200">
                    <div className="pl-3">
                        <Building className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Enter room (e.g., N101, S222)"
                        className="w-full px-3 py-3 outline-none bg-transparent placeholder-gray-400"
                        maxLength="4"
                        disabled={disabled}
                    />
                    
                    {inputValue && (
                        <button
                            onClick={handleClear}
                            className="pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
                
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                        {/* Recent Rooms */}
                        {recentRooms.length > 0 && inputValue === '' && (
                            <div className="px-3 pt-2">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Recent Rooms
                                </p>
                                {recentRooms.map(room => (
                                    <button
                                        key={`recent-${room}`}
                                        onClick={() => handleSelectRoom(room)}
                                        className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <DoorOpen className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{room}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Recent</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {/* Suggestions */}
                        <div className="px-3 pt-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                {inputValue ? 'Suggestions' : 'Available Rooms'}
                            </p>
                            {suggestions.map(room => (
                                <button
                                    key={room}
                                    onClick={() => handleSelectRoom(room)}
                                    className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors text-left"
                                >
                                    <div className="flex items-center space-x-2">
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${getWingColor(room)}`}>
                                            {room.startsWith('N') ? 'North' : 'South'}
                                        </div>
                                        <span className="font-medium">{room}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">Room</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Wing indicators */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                        <span className="text-xs text-gray-600">North Wing</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-pink-500 mr-1"></div>
                        <span className="text-xs text-gray-600">South Wing</span>
                    </div>
                </div>
                <span className="text-xs text-gray-400">
                    {inputValue.length}/4
                </span>
            </div>
        </div>
    );
};

export default RoomSelector;