const mongoose = require('mongoose');


const gpSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    nin: {
        type: String,
        required: false,
        default: null,
        maxLength: 13,
        required: false,
    },
    nomEntreprise: {
        type: String,
        default: null,
        required: false,
    },
    numEmployees: {
        type: String,
        default: null,
        required: false,
    }
});

module.exports = mongoose.model('GP', gpSchema);