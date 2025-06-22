export interface BookingState {
    step: number
    service?: Service
    bodyPart?: BodyPart
    selectedDate?: Date
    selectedTime?: string
    patientDetails?: PatientDetails
    referralFile?: File
    referralUrl?: string
}

export interface Service {
    id: string
    name: string
    code: string
    category: string
    description?: string
    durationMinutes: number
    active: boolean
}

export interface BodyPart {
    id: string
    name: string
    serviceId: string
    preparationText?: string
    active: boolean
}

export interface PatientDetails {
    title?: string
    firstName: string
    lastName: string
    dateOfBirth: Date
    email?: string
    mobile?: string
    notes?: string
}

export interface TimeSlot {
    time: string
    available: boolean
}

export interface AppointmentBooking {
    service: Service
    bodyPart: BodyPart
    scheduledDatetime: Date
    patientDetails: PatientDetails
    referralUrl?: string
    notes?: string
}