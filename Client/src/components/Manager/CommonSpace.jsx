import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/css/Manager/commonSpace.css';
import { optimisticDeleteSpace, AddSpace, DeleteSpace, EditSpace, fetchDataforManager } from '../../Slices/CommonSpaceSlice';
import { ToastContainer, toast } from 'react-toastify';
import { BarChart3, Building2, Calendar, CheckCircle } from 'lucide-react';

import { io } from 'socket.io-client';

export const CommonSpace = () => {
  const dispatch = useDispatch();
  const { avalaibleSpaces, Bookings } = useSelector((state) => state.CommonSpace);
  const [isManagementVisible, setIsManagementVisible] = useState(false);
  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRejectionPopupOpen, setIsRejectionPopupOpen] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [BookingDetailsopen, setBookingDetailsOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState({});
  const [toggleRent, setToggleRent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Occupancy rate stored in component state and recalculated when bookings change
  const [occupancyRate, setOccupancyRate] = useState(0);

  useEffect(() => {
    if (Bookings && Bookings.length > 0) {
      const approvedCount = Bookings.filter((b) => b.status === 'Approved').length;
      const rate = Math.round((approvedCount / Bookings.length) * 100);
      console.log('Approved bookings:', approvedCount);
      console.log('Calculated occupancy rate:', rate);
      setOccupancyRate(rate);
    } else {
      setOccupancyRate(0);
    }
  }, [Bookings]);


  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { spaceType: '', spaceName: '', bookable: 'true', bookingRent: '', bookingRules: '', Type: '' },
  });

  useEffect(() => {
    dispatch(fetchDataforManager());
  }, [dispatch]);

  const Type = watch('Type');
  useEffect(() => {
    if (Type === 'Slot') setToggleRent(false);
    else if (Type === 'Subscription') setToggleRent(true);
  }, [watch('Type')]);

  const handleToggleManagement = () => setIsManagementVisible((prev) => !prev);
  const handleOpenAddForm = () => {
    setIsEditing(false);
    reset();
    setIsSpaceFormOpen(true);
  };

  const handleEditSpace = (space) => {
    setIsEditing(true);
    setValue('spaceType', space.type);
    setValue('spaceName', space.name);
    setValue('bookable', String(space.bookable));
    setValue('bookingRent', space.rent || '');
    setValue('bookingRules', space.bookingRules || '');
    setValue('id', space._id);
    setIsSpaceFormOpen(true);
  };

  const handleDeleteSpace = (space) => {
    if (window.confirm(`Are you sure you want to delete the space "${space.name}"?`)) {
      dispatch(optimisticDeleteSpace(space._id));
      dispatch(DeleteSpace(space._id))
        .unwrap()
        .then(() => toast.success('Space deleted successfully'));
    }
  };

  const handleApprove = (bookingId) => console.log('Approving booking:', bookingId);
  const openRejectPopup = (bookingId) => {
    setBookingToReject(bookingId);
    setIsRejectionPopupOpen(true);
  };
  const handleRejectionSubmit = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }
    setIsRejectionPopupOpen(false);
    setRejectionReason('');
    setBookingToReject(null);
  };

  // Filter bookings based on search query
  const filteredBookings = Bookings.filter((booking) => {
    const searchLower = searchQuery.toLowerCase();
    const spaceName = booking.name?.toLowerCase() || '';
    const bookingDate = new Date(booking.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toLowerCase();
    const bookingStatus = booking.status?.toLowerCase() || '';
    const bookingId = booking.ID?.toLowerCase() || '';

    return (
      spaceName.includes(searchLower) ||
      bookingDate.includes(searchLower) ||
      bookingStatus.includes(searchLower) ||
      bookingId.includes(searchLower)
    );
  });

  const onSubmit = (data) => {
    const payload = { ...data, bookable: data.bookable === 'true' };
    if (isEditing) {
      dispatch(EditSpace({ id: data.id, updatedData: payload }));
      toast.success('Space updated successfully');
    } else dispatch(AddSpace(payload));
    setIsSpaceFormOpen(false);
    reset();
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />
      <div className="management-section">
        <div className="management-header">
          <h3 style={{ color: 'rgba(0, 0, 0, 0.669)' }}>Manage Common Spaces</h3>
          <button className="toggle-management" onClick={handleToggleManagement}>
            {isManagementVisible ? 'Hide Management' : 'Show Management'}
          </button>
        </div>

        <AnimatePresence>
          {isManagementVisible && (
            <motion.div id="managementContent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="d-flex justify-content-end">
                <button className="toggle-management" id="addSpaceBtn" onClick={handleOpenAddForm}>
                  <i className="bi bi-plus"></i>Add New Space
                </button>
              </div>

              <AnimatePresence>
                {isSpaceFormOpen && (
                  <motion.div className="popup" id="spaceFormPopup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div
                      className="popup-content"
                      id="spaceForm"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                    >
                      <div className="d-flex justify-content-center align-items-start">
                        <h4 id="formTitle">{isEditing ? 'Edit Common Space' : 'Add New Common Space'}</h4>
                        <i className="bi bi-x rounded-circle" id="closeSpaceForm" onClick={() => setIsSpaceFormOpen(false)}></i>
                      </div>
                      <form onSubmit={handleSubmit(onSubmit)} id="spaceFormElement">
                        <div className="form-row">
                          <input className="d-none" type="hidden" {...register('id')} />
                          <div className="form-group">
                            <label htmlFor="spaceType">Space Type</label>
                            <select className="form-control" id="spaceType" {...register('spaceType', { required: true })}>
                              <option value="">Select Type</option>
                              <option value="Clubhouse">Clubhouse</option>
                              <option value="Banquet Hall">Banquet Hall</option>
                              <option value="Swimming Pool">Swimming Pool</option>
                              <option value="Guest Room">Guest Room</option>
                              <option value="Gym">Gym</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="spaceName">Space Name</label>
                            <input type="text" className="form-control" id="spaceName" {...register('spaceName', { required: true })} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="Type">Space booking Type</label>
                          <select className="form-control" id="Type" {...register('Type', { required: true })}>
                            <option value="">Select Type</option>
                            <option value="Slot">Slots based</option>
                            <option value="Subscription">Subscription based</option>
                          </select>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="bookable">Bookable</label>
                            <select className="form-control" id="bookable" {...register('bookable', { required: true })}>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label htmlFor="bookingRent">{toggleRent ? 'Subscription Fee :' : 'Rent (per hour)'}</label>
                            <input type="text" className="form-control" id="bookingRent" {...register('bookingRent')} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="bookingRules">Booking Rules</label>
                          <textarea className="form-control" id="bookingRules" {...register('bookingRules')} rows="3"></textarea>
                        </div>
                        <div className="form-actions">
                          <button type="button" className="btn btn-secondary" onClick={() => setIsSpaceFormOpen(false)}>Cancel</button>
                          <button type="submit" className="btn btn-primary">{isEditing ? 'Update Space' : 'Save Space'}</button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                className="space-list"
                id="spacesList"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {avalaibleSpaces?.length > 0 ? (
                  avalaibleSpaces.map((space) => (
                    <motion.div key={space._id} className="space-item" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="space-actions">
                        <button className="edit-space-btn" onClick={() => handleEditSpace(space)}><i className="bi bi-pencil"></i></button>
                        <button className="delete-space-btn" onClick={() => handleDeleteSpace(space)}><i className="bi bi-trash"></i></button>
                      </div>
                      <h4>{space?.name}</h4>
                      <p><strong>Type:</strong> {space?.type}</p>
                      <p><strong>Bookable:</strong> {space?.bookable ? 'Yes' : 'No'}</p>
                      <p><strong>Rent:</strong> {space?.rent}</p>
                      {space.bookingRules && <p><strong>Rules:</strong> {space.bookingRules.substring(0, 50)}...</p>}
                    </motion.div>
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="bi bi-building"></i>
                    <h3>No Common Spaces Configured</h3>
                    <p>Add your first common space to get started.</p>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div className="stats-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="stat-card border-0">
          <Calendar size={24} className="text-primary" />
          <h3>Total Bookings Today</h3>
          <span className="stat-number text-primary">{Bookings.length}</span>
        </div>
        <div className="stat-card border-0">
          <BarChart3 size={24} className="text-warning" />
          <h3>Occupancy Rate</h3>
          <span className="stat-number text-warning">{occupancyRate}%</span>
        </div>
        <div className="stat-card border-0">
          <CheckCircle size={24} className="text-success" />
          <h3>Approved</h3>
          <span className="stat-number text-success">{Bookings.filter((c) => c.status === 'Approved').length}</span>
        </div>
        <div className="stat-card border-0">
          <Building2 size={24} className="text-info" />
          <h3>Total Amenities</h3>
          <span className="stat-number text-info">{Bookings.filter((c) => c.status === 'Approved').length}</span>
        </div>
      </motion.div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by space, date or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="approve-all" onClick={() => setSearchQuery('')}>Clear</button>
      </div>

      <motion.div className="bookings-container" id="bookingsContainer" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((c) => (
            <motion.div key={c._id} className="booking-card d-flex flex-column" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="booking-card-header">
                <span className="booking-id">ID: {c.ID}</span>
                <span className={`booking-status status-${c.status}`}>{c.status}</span>
              </div>
              <h3 className="booking-space">{c.name}</h3>
              <div className="booking-datetime">
                <i className="bi bi-calendar-event"></i>
                <span>{new Date(c.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, {c.from} - {c.to}</span>
              </div>
              <div className="booking-actions">
                {c.status === 'Pending' ? (
                  <button className="available-btn" data-id={c._id}><i className="bi bi-eye"></i> Check Availability</button>
                ) : c.status === 'Avalaible' ? (
                  <>
                    <button className="approve-btn" onClick={() => handleApprove(c._id)}><i className="bi bi-check-circle-fill"></i> Approve</button>
                    <button className="reject-btn" onClick={() => openRejectPopup(c._id)}><i className="bi bi-x-circle-fill"></i> Reject</button>
                  </>
                ) : (
                  <button className="view-btn" onClick={() => { setCurrentBooking(c); setBookingDetailsOpen(true); }}>
                    <i className="bi bi-eye"></i> View Details
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state w-100">
            <i className="bi bi-calendar-x"></i>
            <h3>No Bookings Found</h3>
            <p>There are currently no common space bookings to display.</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isRejectionPopupOpen && (
          <motion.div id="cancellationReasonPopup" className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <h3>Rejection Reason</h3>
              <textarea
                id="rejectionReason"
                rows="4"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              ></textarea>
              <div style={{ marginTop: '15px', textAlign: 'right' }}>
                <button onClick={() => setIsRejectionPopupOpen(false)} className="btn btn-secondary me-2">Cancel</button>
                <button id="submitRejection" onClick={handleRejectionSubmit} className="btn btn-danger">Submit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {BookingDetailsopen && (
          <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <div className="popup-header">
                <h2><i className="bi bi-calendar-check me-2"></i>Booking Details</h2>
                <button className="close-btn" onClick={() => setBookingDetailsOpen(false)}><i className="bi bi-x-lg"></i></button>
              </div>
              <div className="popup-body">
                <div className="details-grid">
                  <div className="detail-item"><div className="detail-label">Booking ID</div><div className="detail-value">{currentBooking?.ID}</div></div>
                  <div className="detail-item"><div className="detail-label">Booking Status</div><div className="detail-value"><span className={`status-badge status-${currentBooking?.status}`}>{currentBooking?.status}</span></div></div>
                  <div className="detail-item"><div className="detail-label">Space Name</div><div className="detail-value">{currentBooking?.name}</div></div>
                  <div className="detail-item"><div className="detail-label">Booked By</div><div className="detail-value">{currentBooking?.bookedBy?.residentFirstname} {currentBooking?.bookedBy?.residentLastname}</div></div>
                  <div className="detail-item"><div className="detail-label">Contact Email</div><div className="detail-value">{currentBooking?.bookedBy?.email}</div></div>
                  <div className="detail-item"><div className="detail-label">Booking Date</div><div className="detail-value">{new Date(currentBooking.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div></div>
                  <div className="detail-item"><div className="detail-label">Time Slot</div><div className="detail-value">{currentBooking?.from} - {currentBooking?.to}</div></div>
                  <div className="detail-item col-span-2"><div className="detail-label">Purpose</div><div className="detail-value">{currentBooking?.description}</div></div>
                </div>

                {currentBooking?.payment && currentBooking.status !== 'Cancelled' && (
                  <div className="payment-box">
                    <h4>Payment Information</h4>
                    <div className="detail-item"><div className="detail-label">Amount</div><div className="detail-value">₹{currentBooking?.payment?.amount || 0}</div></div>
                    <div className="detail-item"><div className="detail-label">Payment Status</div><div className="detail-value"><span className="status-badge status-Completed">{currentBooking?.payment?.status}</span></div></div>
                  </div>
                )}

                {currentBooking?.status === 'Cancelled' && (
                  <div className="cancellation-box">
                    <h4>Cancellation Details</h4>
                    <div className="detail-item"><div className="detail-label">Cancellation Reason:</div><div className="detail-value">{currentBooking?.cancellationReason || 'N/A'}</div></div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
