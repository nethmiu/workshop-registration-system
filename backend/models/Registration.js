const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: [true, 'Workshop ID is required']
    },
    attendeeName: {
      type: String,
      required: [true, 'Attendee name is required'],
      trim: true,
      minlength: [2, 'Attendee name must be at least 2 characters long'],
      maxlength: [100, 'Attendee name cannot exceed 100 characters']
    },
    attendeeEmail: {
      type: String,
      required: [true, 'Attendee email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid attendee email address'
      ]
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'cancelled'],
        message: '{VALUE} is not a valid status. Allowed values: active, cancelled'
      },
      default: 'active'
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Registered by user reference is required']
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelReason: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
