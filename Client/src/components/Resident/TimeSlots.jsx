import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const formatTime = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
};

export const TimeSlots = ({ selectedFacility, selectedDate, selectedSlots, setSelectedSlots }) => {
    const [availableSlots, setAvailableSlots] = useState([]);

    useEffect(() => {
        if (selectedFacility && selectedDate) {
            const bookedForDate = selectedFacility.bookedSlots?.find(
                b => new Date(b.date).toISOString().split('T')[0] === selectedDate
            );
            const bookedSlots = bookedForDate?.slots || [];
            const allSlots = Array.from({ length: 22 - 6 }, (_, i) => String(i + 6).padStart(2, '0') + ":00");
            
            
            const freeSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
            setAvailableSlots(freeSlots);
            setSelectedSlots([]);
        } else {
            setAvailableSlots([]);
            setSelectedSlots([]);
        }
    }, [selectedFacility, selectedDate, setSelectedSlots]);

    const handleTimeSlotChange = (e) => {
        const value = e.target.value;
        const hour = parseInt(value.split(":")[0]);
        if (selectedSlots.includes(value)) {
            setSelectedSlots(selectedSlots.filter(slot => slot !== value));
            return;
        }
        if (selectedSlots.length === 0) {
            setSelectedSlots([value]);
            return;
        }
        const selectedHours = selectedSlots.map(slot => parseInt(slot.split(":")[0]));
        const min = Math.min(...selectedHours);
        const max = Math.max(...selectedHours);
        if (hour === min - 1 || hour === max + 1) {
            const newSlots = [...selectedSlots, value].sort((a, b) => parseInt(a.split(":")[0]) - parseInt(b.split(":")[0]));
            setSelectedSlots(newSlots);
        } else {
            toast.warning("Please select adjacent time slots only.");
        }
    };

    const formatSelectedTime = () => {
        if (selectedSlots.length === 0) return "No time slots selected";
        const firstHour = parseInt(selectedSlots[0].split(':')[0]);
        const lastHour = parseInt(selectedSlots[selectedSlots.length - 1].split(':')[0]);
        return `${formatTime(firstHour)} - ${formatTime(lastHour + 1)}`;
    };

    

    return (
        <div className="time-slots-container">
            <div className="time-slots-header">
                <h4 className="time-slots-title"><i className="bi bi-clock"></i> Available Time Slots</h4>
                <div className="time-period-info">6:00 AM - 10:00 PM</div>
            </div>
            <div className="time-slots-grid">
                {availableSlots.map(hour => {
                    const displayTime = formatTime(parseInt(hour.split(':')[0]));
                    const isChecked = selectedSlots.includes(hour);
                    return (
                        <div key={hour} className={`time-slot ${isChecked ? 'selected' : ''}`}>
                            <input
                                type="checkbox"
                                value={hour}
                                id={`slot_${hour}`}
                                checked={isChecked}
                                onChange={handleTimeSlotChange}
                            />
                            <label htmlFor={`slot_${hour}`}>{displayTime}</label>
                        </div>
                    );
                })}
            </div>
            <div className="selected-time-display">
                <strong>Selected Time: </strong>
                <span className={selectedSlots.length === 0 ? "no-selection" : ""}>{formatSelectedTime()}</span>
            </div>
        </div>
    );
};
