import Payment from '../models/payment.js';
import Resident from '../models/resident.js';
import CommunityManager from "../models/cManager.js";
import Notifications from "../models/Notifications.js";
import { getIO } from "../utils/socket.js";

class PaymentController {
    /**
     * Get all payments for the community manager
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAllPayments(req, res) {
        try {
            // Step 1: Get community manager ID from the logged-in user
            
    
            const community=req.user.community;
    
            // Step 3: Find all payments for this community
            const payments = await Payment.find({ community })
                .populate('receiver', 'name')
                .populate('sender', 'name flatNumber')
                .sort({ paymentDeadline: -1 }); // newest first
            console.log(payments)

            return res.status(200).json(payments);
        } catch (error) {
            console.error('Error fetching payments:', error);
            return res.status(500).json({ message: 'Error fetching payments', error: error.message });
        }
    }

    /**
     * Get all payments for a resident (for resident dashboard)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getResidentPayments(req, res) {
        try {
            // Get resident ID from logged-in user
            const residentId = req.user.id;
            
            // Find payments where this resident is the sender
            const payments = await Payment.find({ sender: residentId })
                .populate('receiver', 'name')
                .populate('sender', 'name flatNumber')
                .sort({ paymentDeadline: -1 });
            
            return res.status(200).json(payments);
        } catch (error) {
            console.error('Error fetching resident payments:', error);
            return res.status(500).json({ message: 'Error fetching payments', error: error.message });
        }
    }
    
    /**
     * Create a new payment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async createPayment(req, res) {
        try {
            const {
                title,
                senderId,
                receiverId,
                amount,
                remarks,
                paymentDeadline,
                paymentMethod
            } = req.body;
    
            // Validate required fields
            if (!title || !senderId || !receiverId || !amount) {
                return res.status(400).json({ message: 'Missing required fields' });
            }
            console.log(req.body)
            
    
            const communityId = req.user.community;
    
            // Step 2: Create payment
            let payment = new Payment({
                title,
                sender: senderId,
                receiver: receiverId,
                amount,
                community:communityId,
                paymentDeadline: paymentDeadline || new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000),
                paymentMethod: paymentMethod || 'None',
                status: "Pending",
                remarks: remarks || ""
            });
            console.log(payment)
            await payment.save();
    
            // Step 3: Populate sender and receiver
            await payment.populate('sender', 'name flatNumber');
            await payment.populate('receiver', 'name');
    
            return res.status(201).json(payment);
        } catch (error) {
            console.error('Error creating payment:', error);
            return res.status(500).json({ message: 'Error creating payment', error: error.message });
        }
    }
    /**
     * Create a new payment by resident (self-payment)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async createResidentPayment(req, res) {
        try {
            const {
                title,
                amount,
                paymentMethod,
                receiverId // Optional - could be community manager or maintenance dept
            } = req.body;

            // Validate required fields
            if (!title || !amount) {
                return res.status(400).json({ message: 'Title and amount are required' });
            }

            // Get resident info
            const residentId = req.user.id;
            const resident = await Resident.findById(residentId);
            
            if (!resident) {
                return res.status(404).json({ message: 'Resident not found' });
            }

            const communityId = resident.community;

            // If no receiver specified, find community manager as default receiver
            let finalReceiverId = receiverId;
            if (!finalReceiverId) {
                const manager = await CommunityManager.findOne({ assignedCommunity: communityId });
                if (manager) {
                    finalReceiverId = manager._id;
                } else {
                    // If no manager found, use the resident as both sender and receiver (self-payment)
                    finalReceiverId = residentId;
                }
            }

            // Create payment
            const payment = new Payment({
                title,
                sender: residentId,
                receiver: finalReceiverId,
                amount,
                communityId,
                paymentDeadline: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                paymentMethod: paymentMethod || 'Online',
                status: 'Completed', // Mark as completed since resident is paying immediately
                paymentDate: new Date(),
                remarks: 'Self-payment by resident'
            });

            await payment.save();

            // Populate for response
            await payment.populate('sender', 'residentFirstname flatNo');
            await payment.populate('receiver', 'name');

            return res.status(201).json(payment);
        } catch (error) {
            console.error('Error creating resident payment:', error);
            return res.status(500).json({ message: 'Error creating payment', error: error.message });
        }
    }
    
    /**
     * Get all residents in the community
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAllResidents(req, res) {
        try {
            // Step 1: Get community manager ID from the logged-in user
           
    
            const communityId = req.user.community
            
            // Step 3: Find all residents linked to that community
            const residents = await Resident.find({ 
                community: communityId
            }).select('residentFirstname flatNo email contact');
            
            return res.status(200).json(residents);
        } catch (error) {
            console.error('Error fetching residents:', error);
            return res.status(500).json({ message: 'Error fetching residents', error: error.message });
        }
    }
    
    /**
     * Get the current logged-in community manager
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getCurrentcManager(req, res) {
        try {
            const userId = req.user.id;
        
            const user = await CommunityManager.findById(userId)
                .select('name email assignedCommunity')
                .populate('assignedCommunity', 'name blocks');
            
            if (!user) {
                return res.status(404).json({ message: 'cManager not found' });
            }
            
            return res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching current user:', error);
            return res.status(500).json({ message: 'Error fetching user data', error: error.message });
        }
    }

    /**
     * Get the current logged-in resident
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getCurrentResident(req, res) {
        try {
            const userId = req.user.id;
        
            const user = await Resident.findById(userId)
                .select('residentFirstname email flatNo contact community')
                .populate('community', 'name');
            
            if (!user) {
                return res.status(404).json({ message: 'Resident not found' });
            }
            
            return res.status(200).json(user);
        } catch (error) {
            console.error('Error fetching current resident:', error);
            return res.status(500).json({ message: 'Error fetching user data', error: error.message });
        }
    }

    /**
     * Get a specific payment by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getPaymentById(req, res) {
        try {
            const { id } = req.params;
            
            // Find the payment
            const payment = await Payment.findById(id)
                .populate('sender', 'residentFirstname flatNo name')
                .populate('receiver', 'name');
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }
            
            return res.status(200).json(payment);
        } catch (error) {
            console.error('Error fetching payment:', error);
            return res.status(500).json({ message: 'Error fetching payment', error: error.message });
        }
    }

    /**
     * Update a payment (for managers)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updatePayment(req, res) {
        try {
            const { id } = req.params;
            const { status, remarks, paymentMethod, amount } = req.body;
            
            // Get manager's community
            const managerId = req.user.id;
            const manager = await CommunityManager.findById(managerId);
            
            if (!manager || !manager.assignedCommunity) {
                return res.status(400).json({ message: 'Invalid community manager' });
            }
            
            // Find the payment and verify it belongs to manager's community
            const payment = await Payment.findOne({
                _id: id,
                communityId: manager.assignedCommunity
            });
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found or access denied' });
            }
            
            // Update allowable fields
            if (status) {
                payment.status = status;
                // If status is changed to completed, set payment date
                if (status === 'Completed' && !payment.paymentDate) {
                    payment.paymentDate = new Date();
                    
                    // If this payment belongs to an issue, update issue status to Closed
                    if (payment.belongTo === 'Issue' && payment.belongToId) {
                        const Issue = (await import('../models/issues.js')).default;
                        await Issue.findByIdAndUpdate(payment.belongToId, { status: 'Closed' });
                    }
                }
            }
            
            if (paymentMethod) payment.paymentMethod = paymentMethod;
            if (remarks !== undefined) payment.remarks = remarks;
            if (amount !== undefined) {
                const cost = parseFloat(amount);
                if (isNaN(cost) || cost < 0) {
                    return res.status(400).json({ message: 'Invalid amount' });
                }
                payment.amount = cost;
            }
            
            await payment.save();
            
            // Populate for response
            await payment.populate('sender', 'residentFirstname flatNo name');
            await payment.populate('receiver', 'name');
            
            return res.status(200).json(payment);
        } catch (error) {
            console.error('Error updating payment:', error);
            return res.status(500).json({ message: 'Error updating payment', error: error.message });
        }
    }

    /**
     * Update payment by resident (for completing payments)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateResidentPayment(req, res) {
        try {
            const { id } = req.params;
            const { status, paymentMethod, paymentDate } = req.body;
            
            const residentId = req.user.id;
            
            // Find payment where resident is the sender
            const payment = await Payment.findOne({
                _id: id,
                sender: residentId
            });
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found or access denied' });
            }
            
            // Update payment
            if (status) {
                payment.status = status;
                if (status === 'Completed') {
                    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();

                    // If this payment belongs to an issue, close the issue
                    if (payment.belongTo === 'Issue' && payment.belongToId) {
                        const Issue = (await import('../models/issues.js')).default;
                        await Issue.findByIdAndUpdate(payment.belongToId, { status: 'Closed' });

                        if (payment.community) {
                            const manager = await CommunityManager.findOne({ assignedCommunity: payment.community });
                            if (manager) {
                                const notification = new Notifications({
                                    type: "Payment",
                                    title: "Issue Payment Completed",
                                    message: `Payment completed for issue ${payment.belongToId}.`,
                                    referenceId: payment._id,
                                    referenceType: "Payment"
                                });
                                await notification.save();
                                manager.notifications.push(notification._id);
                                await manager.save();
                            }
                        }

                        const io = getIO();
                        if (io) {
                            io.to(`community_${payment.community}`).emit("issue:updated", {
                                action: "payment_completed",
                                issueId: payment.belongToId,
                                status: "Closed",
                                community: payment.community,
                                updatedAt: new Date().toISOString(),
                            });
                            io.to(`resident_${residentId}`).emit("issue:updated", {
                                action: "payment_completed",
                                issueId: payment.belongToId,
                                status: "Closed",
                                updatedAt: new Date().toISOString(),
                            });
                        }
                    }
                }
            }
            
            if (paymentMethod) {
                payment.paymentMethod = paymentMethod;
            }
            
            await payment.save();
            
            // Populate for response
            await payment.populate('sender', 'residentFirstname flatNo');
            await payment.populate('receiver', 'name');
            
            return res.status(200).json({ 
                message: 'Payment updated successfully',
                payment 
            });
        } catch (error) {
            console.error('Error updating resident payment:', error);
            return res.status(500).json({ message: 'Error updating payment', error: error.message });
        }
    }

    /**
     * Delete a payment (for managers only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deletePayment(req, res) {
        try {
            const { id } = req.params;
            
            // Get manager's community
            const managerId = req.user.id;
            const manager = await CommunityManager.findById(managerId);
            
            if (!manager || !manager.assignedCommunity) {
                return res.status(400).json({ message: 'Invalid community manager' });
            }
            
            // Find and verify payment belongs to manager's community
            const payment = await Payment.findOne({
                _id: id,
                communityId: manager.assignedCommunity
            });
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found or access denied' });
            }
            
            // Delete the payment
            await Payment.deleteOne({ _id: id });
            
            return res.status(200).json({ message: 'Payment deleted successfully' });
        } catch (error) {
            console.error('Error deleting payment:', error);
            return res.status(500).json({ message: 'Error deleting payment', error: error.message });
        }
    }
    
    /**
     * Update payment status and method (legacy method - keeping for compatibility)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updatePaymentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, paymentMethod } = req.body;
            
            if (!status && !paymentMethod) {
                return res.status(400).json({ message: 'Status or payment method is required' });
            }
            
            const payment = await Payment.findById(id);
            
            if (!payment) {
                return res.status(404).json({ message: 'Payment not found' });
            }
            
            // Update payment status
            if (status) {
                payment.status = status;
                
                // If payment is now complete, set the completion date
                if (status === 'Completed' && !payment.paymentDate) {
                    payment.paymentDate = new Date();
                }
            }
            
            // Update payment method
            if (paymentMethod) {
                payment.paymentMethod = paymentMethod;
            }
            
            await payment.save();
            
            return res.status(200).json(payment);
        } catch (error) {
            console.error('Error updating payment status:', error);
            return res.status(500).json({ message: 'Error updating payment status', error: error.message });
        }
    }
}

export default PaymentController;