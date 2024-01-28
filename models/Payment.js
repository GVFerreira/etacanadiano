const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Payment = new Schema({
    transaction_amount: {
        type: Number,
        required: true
    },
    transactionId: {
        type: String
    },
    client_secret: {
        type: String,
        required: true
    },
    status: {
        type: String,
    },
    visaIDs: [{ 
        type: Schema.Types.ObjectId,
        ref: 'visa'
    }],
    updatedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        required: true
    }
})

mongoose.model("payment", Payment)