const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Visa = new Schema({
    representative: {
        type: Number,
        required: true
    },
    representativeRelationship: {
        type: String
    },
    representativePayed: {
        type: Number
    },
    representativeName: {
        type: String
    },
    representativeSurname: {
        type: String
    },
    representativeOrgName: {
        type: String
    },
    representativeAddress: {
        type: String
    },
    representativeEmail: {
        type: String
    },
    representativeNumTel: {
        type: String
    },
    representativeNumIDmebro: {
        type: String
    },
    representativeProvOrTer: {
        type: String
    },
    representativeCodpostal: {
        type: String
    },
    document: {
        type: String,
        required: true
    },
    codPassport: {
        type: String,
        required: true
    },
    nationalityPassport: {
        type: String,
        required: true
    },
    residentUSCIS: {
        type: Number
    },
    airplane: {
        type: Number,
    },
    canadaVisa: {
        type: Number,
    },
    nonImmigrateVisa: {
        type: Number,
    },
    numVisaNonImmigrate: {
        type: String
    },
    dateVisaNonImmigrate: {
        type: String
    },
    numPassport: {
        type: String,
        required: true
    },
    doiPassport: {
        type: String,
        required: true
    },
    doePassport: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    dateBirthday: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    countryBirth: {
        type: String,
        required: true
    },
    cityBirth: {
        type: String,
        required: true
    },
    nationalitiesExtra: {
        type: String
    },
    maritalStatus: {
        type: String,
        required: true
    },
    appliedToCanada: {
        type: Number,
        required: true
    },
    personalUCI: {
        type: String
    },
    occupation: {
        type: String,
        required: true
    },
    employmentTitle: {
        type: String
    },
    employmentCompanyName: {
        type: String
    },
    employmentCountry: {
        type: String
    },
    employmentCity: {
        type: String
    },
    employmentFromDateYear: {
        type: String
    },
    contactEmail: {
        type: String,
        required: true
    },
    contactTel : {
        type: String,
        required: true
    },
    addressName: {
        type: String,
        required: true
    },
    addressNumber: {
        type: String,
        required: true
    },
    addressComplement: {
        type: String
    },
    addressCity: {
        type: String,
        required: true
    },
    addressState: {
        type: String,
        required: true
    },
    addressCountry: {
        type: String,
        required: true
    },
    travelWhen: {
        type: Number,
        required: true
    },
    travelDate: {
        type: String
    },
    travelTime: {
        type: String
    },
    travelTimeZone: {
        type: String
    },
    refusedVisaToCanda: {
        type: Number,
        required: true
    },
    refusedVisaToCandaDetails: {
        type: String
    },
    criminalOffenceAnywhere: {
        type: Number,
        required: true
    },
    criminalOffenceAnywhereDetails: {
        type: String
    },
    tuberculosis: {
        type: Number,
        required: true
    },
    tuberculosisResultCareWorker: {
        type: Number
    },
    diagnosedWithTuberculosis: {
        type: Number
    },
    theseConditions: {
        type: String,
        required: true
    },
    canadaDuringStayDetails: {
        type: String
    },
    agreeCheck: {
        type: String,
        required: true
    },
    consentAndDeclaration: {
        type: String,
        required: true
    },
    codeETA: {
        type: String,
        required: true
    },
    statusETA: {
        type: String,
        default: 'Em análise',
        required: true
    },
    attachments: {
        type: Array
    },
    pagamento: {
        type: Schema.Types.ObjectId,
        ref: 'payment'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

mongoose.model("visa", Visa)