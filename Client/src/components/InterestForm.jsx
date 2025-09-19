import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import '../assets/css/InterestForm.css';

export const InterestForm = () => {
    const navigate = useNavigate();
    // Add CSS animation for loading spinner
    const spinnerStyle = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes slideInDown {
            0% {
                transform: translateX(-50%) translateY(-100%);
                opacity: 0;
            }
            100% {
                transform: translateX(-50%) translateY(0);
                opacity: 1;
            }
        }
    `;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        communityName: '',
        location: '',
        otherCity: '',
        description: ''
    });
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            location: value,
            otherCity: value === 'Other' ? prev.otherCity : ''
        }));
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setPhotos(files);
    };

    const showAlert = (message, type = 'error') => {
        setAlert({ show: true, message, type });
        // Auto-hide success messages after 8 seconds, errors after 6 seconds
        const timeout = type === 'success' ? 8000 : 6000;
        setTimeout(() => {
            setAlert({ show: false, message: '', type: '' });
        }, timeout);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create FormData object to send all data including photos
            const submitData = new FormData();
            
            // Add all form fields
            Object.keys(formData).forEach(key => {
                if (key === 'otherCity' && formData.location !== 'Other') return;
                submitData.append(key, formData[key]);
            });

            // If "Other" city is selected, use otherCity as location
            if (formData.location === 'Other' && formData.otherCity) {
                submitData.set('location', formData.otherCity);
            }

            // Add photos directly to FormData
            photos.forEach(photo => {
                submitData.append('photos', photo);
            });

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            const response = await fetch(`${API_BASE_URL}/interest/submit`, {
                method: 'POST',
                body: submitData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                showAlert('Application submitted successfully!', 'success');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    communityName: '',
                    location: '',
                    otherCity: '',
                    description: ''
                });
                setPhotos([]);
                document.getElementById('photoInput').value = '';
                // Redirect to login after a short delay so user sees the success message
                setTimeout(() => navigate('/SignIn'), 1200);
            } else {
                // Show specific error message from server
                const errorMsg = result.message || 'Submission failed';
                showAlert(`Failed: ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('Submit error:', error);
            let errorMessage = '';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Connection failed - server not running on port 3000';
            } else if (error.message.includes('HTTP 400')) {
                errorMessage = 'Validation error - check required fields and formats';
            } else if (error.message.includes('HTTP 409')) {
                errorMessage = 'Duplicate found - email or community already exists';
            } else if (error.message.includes('HTTP 413')) {
                errorMessage = 'Files too large - max 5MB per photo, 5 photos total';
            } else if (error.message.includes('HTTP 500')) {
                errorMessage = 'Server error - please try again in a few minutes';
            } else {
                errorMessage = `Error: ${error.message} - please contact support`;
            }
            
            showAlert(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className='interestFormCon'>
            {/* Add CSS for spinner animation */}
            <style>{spinnerStyle}</style>
            
            {alert.show && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        maxWidth: '500px',
                        width: '90%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        backgroundColor: alert.type === 'success' ? '#10b981' : '#ef4444',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        border: alert.type === 'success' ? '1px solid #059669' : '1px solid #dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        animation: 'slideInDown 0.3s ease-out'
                    }}
                >
                    <div style={{ 
                        marginRight: '10px', 
                        fontSize: '20px',
                        minWidth: '24px'
                    }}>
                        {alert.type === 'success' ? '' : ''}
                    </div>
                    <div style={{ 
                        flex: 1,
                        overflow: 'hidden',
                        lineHeight: '1.2'
                    }}>
                        {alert.type === 'success' ? 'Application submitted successfully!' : alert.message}
                    </div>
                    <button 
                        onClick={() => setAlert({ show: false, message: '', type: '' })}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            fontSize: '18px',
                            cursor: 'pointer',
                            marginLeft: '10px',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            lineHeight: '1',
                            minWidth: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}  
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="container">
                <form id="combinedForm" method="POST" encType="multipart/form-data" onSubmit={handleSubmit}>
                    <div className="header">
                        <h2>Community & Manager Registration</h2>
                        <p className="subtitle">Tell us about yourself and the community you manage</p>
                    </div>

                    <div className="form-content">
                        <div className="form-panel">
                            <h3 className="form-section-title">Personal Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name *</label>
                                    <input 
                                        type="text" 
                                        id="firstName" 
                                        name="firstName" 
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name *</label>
                                    <input 
                                        type="text" 
                                        id="lastName" 
                                        name="lastName" 
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email" 
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number *</label>
                                    <input 
                                        type="tel" 
                                        id="phone" 
                                        name="phone" 
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-panel">
                            <h3 className="form-section-title">Community Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="communityName">Community Name *</label>
                                    <input 
                                        type="text" 
                                        id="communityName" 
                                        name="communityName" 
                                        value={formData.communityName}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="location">City *</label>
                                    <select 
                                        id="location" 
                                        name="location" 
                                        value={formData.location}
                                        onChange={handleLocationChange}
                                        required 
                                    >
                                        <option value="">-- Select a City --</option>
                                        <option value="Bangalore">Bangalore</option>
                                        <option value="Chennai">Chennai</option>
                                        <option value="Delhi">Delhi</option>
                                        <option value="Hyderabad">Hyderabad</option>
                                        <option value="Kolkata">Kolkata</option>
                                        <option value="Mumbai">Mumbai</option>
                                        <option value="Pune">Pune</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                            
                            {formData.location === 'Other' && (
                                <div className="form-group" id="otherCityGroup">
                                    <label htmlFor="otherCity">Enter Your City *</label>
                                    <input 
                                        type="text" 
                                        id="otherCity" 
                                        name="otherCity" 
                                        value={formData.otherCity}
                                        onChange={handleInputChange}
                                        placeholder="Type your city name" 
                                        required={formData.location === 'Other'}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="description">Community Description *</label>
                                <textarea 
                                    id="description" 
                                    name="description" 
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="A brief description of your community..." 
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Community Photos (Optional)</label>
                                <div className="photo-upload-area" onClick={() => document.getElementById('photoInput').click()}>
                                    <div>📷</div>
                                    <p>Click to upload photos</p>
                                    <p style={{fontSize: '0.8em', color: '#666'}}>Upload up to 5 photos of your community</p>
                                </div>
                                <input 
                                    type="file" 
                                    id="photoInput" 
                                    name="photos" 
                                    multiple 
                                    accept="image/*" 
                                    style={{display: 'none'}} 
                                    onChange={handlePhotoChange}
                                />
                                {photos.length > 0 && (
                                    <div className="photo-preview-grid">
                                        <p>Selected {photos.length} photo(s)</p>
                                        {Array.from(photos).map((photo, index) => (
                                            <div key={index} className="photo-preview">
                                                {photo.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        {loading && (
                            <div style={{
                                textAlign: 'center',
                                margin: '20px 0',
                                padding: '15px',
                                backgroundColor: '#e3f2fd',
                                borderRadius: '8px',
                                border: '1px solid #2196f3'
                            }}>
                                <div style={{ 
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    border: '3px solid #f3f3f3',
                                    borderTop: '3px solid #2196f3',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    marginRight: '10px'
                                }}></div>
                                <span style={{ color: '#1976d2', fontWeight: '500' }}>
                                    Submitting your application... Please wait
                                </span>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            className="submit-btn" 
                            disabled={loading}
                            style={{
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={{ marginRight: '8px' }}>⏳</span>
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    <span style={{ marginRight: '8px' }}>📧</span>
                                    Submit Application
                                </>
                            )}
                        </button>
                        <div className="login-link">
                            <NavLink to="/SignIn">Already have an account? Login here</NavLink>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}