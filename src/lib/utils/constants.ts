export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
} as const

export const SERVICE_CATEGORIES = {
    CT: 'CT',
    XRAY: 'XRAY',
    DEXA: 'DEXA',
    ULTRASOUND: 'ULTRASOUND',
} as const

export const HL7_MESSAGE_TYPES = {
    ADT_A08: 'ADT^A08',
    OMI_O23: 'OMI^O23',
    ORI_O24: 'ORI^O24',
} as const

export const HL7_MESSAGE_STATUS = {
    PENDING: 'pending',
    SENT: 'sent',
    ACKNOWLEDGED: 'acknowledged',
    FAILED: 'failed',
} as const

export const FACILITY_CODE = 'AXIS'