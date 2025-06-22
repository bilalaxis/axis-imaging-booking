export interface HL7Message {
    messageType: string
    sendingApplication: string
    sendingFacility: string
    receivingApplication: string
    receivingFacility: string
    timestamp: string
    messageControlId: string
    content: string
}

export interface PatientRegistration {
    patientId: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender?: string
    address?: string
    phone?: string
    email?: string
}

export interface ProcedureOrder {
    orderId: string
    accessionNumber: string
    procedureId: string
    studyInstanceUid?: string
    scheduledDateTime: string
    modality: string
    procedureCode: string
    procedureDescription: string
    patientId: string
    referringPhysician?: string
}