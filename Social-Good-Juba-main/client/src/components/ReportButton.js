import React, { useState } from 'react';
import axios from 'axios';
import './ReportButton.css';

const ReportButton = ({ userId, jobId, chatId, userType = 'user' }) => {
    const [showModal, setShowModal] = useState(false);
    const [reportType, setReportType] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reportTypes = [
        { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
        { value: 'spam', label: 'Spam' },
        { value: 'fraud', label: 'Fraud' },
        { value: 'harassment', label: 'Harassment' },
        { value: 'fake_profile', label: 'Fake Profile' },
        { value: 'other', label: 'Other' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reportType || !description.trim()) return;

        setSubmitting(true);
        try {
            await axios.post('/api/reports', {
                reported_user_id: userId,
                report_type: reportType,
                description: description.trim(),
                job_id: jobId || null,
                chat_id: chatId || null
            });

            alert('Report submitted successfully. Our admin team will review it.');
            setShowModal(false);
            setReportType('');
            setDescription('');
        } catch (error) {
            console.error('Report submission error:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <button 
                className="report-btn"
                onClick={() => setShowModal(true)}
                title={`Report this ${userType}`}
            >
                🚨 Report
            </button>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal report-modal">
                        <div className="modal-header">
                            <h3>Report {userType === 'freelancer' ? 'Freelancer' : 'Client'}</h3>
                            <button 
                                className="modal-close"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Report Type</label>
                                <select
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    {reportTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="form-textarea"
                                    placeholder="Please provide details about the issue..."
                                    rows="4"
                                    required
                                />
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    type="submit" 
                                    className="btn btn-danger"
                                    disabled={submitting || !reportType || !description.trim()}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Report'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline"
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportButton;
