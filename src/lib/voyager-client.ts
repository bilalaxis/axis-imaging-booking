import { format } from 'date-fns'

interface VoyagerConfig {
    baseUrl: string
    username: string
    password: string
    facilityId: string
}

interface VoyagerTimeSlot {
    startTime: string
    endTime: string
    available: boolean
    resourceId?: string
}

interface VoyagerAvailabilityResponse {
    date: string
    slots: VoyagerTimeSlot[]
}

export class VoyagerClient {
    private config: VoyagerConfig

    constructor(config: VoyagerConfig) {
        this.config = config
    }

    /**
     * Fetch real-time availability from Voyager
     * This replaces our local availability slots
     */
    async getAvailability(
        serviceId: string,
        dateFrom: string,
        dateTo: string
    ): Promise<VoyagerAvailabilityResponse[]> {
        try {
            // Option 1: If Voyager has a REST API
            if (this.config.baseUrl) {
                const response = await fetch(`${this.config.baseUrl}/api/availability`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
                    },
                    body: JSON.stringify({
                        serviceId,
                        dateFrom,
                        dateTo,
                        facilityId: this.config.facilityId
                    })
                })

                if (!response.ok) {
                    throw new Error(`Voyager API error: ${response.status}`)
                }

                return await response.json()
            }

            // Option 2: If Voyager only supports HL7, we'll need to implement MLLP client
            // This is more complex and requires a dedicated HL7 client library
            throw new Error('HL7 integration not yet implemented')

        } catch (error) {
            console.error('Error fetching Voyager availability:', error)
            throw error
        }
    }

    /**
     * Create appointment in Voyager
     */
    async createAppointment(appointmentData: any): Promise<{ success: boolean; voyagerId?: string }> {
        try {
            // Option 1: REST API
            if (this.config.baseUrl) {
                const response = await fetch(`${this.config.baseUrl}/api/appointments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
                    },
                    body: JSON.stringify({
                        patientId: appointmentData.patientId,
                        serviceId: appointmentData.serviceId,
                        scheduledDateTime: appointmentData.scheduledDatetime,
                        duration: appointmentData.duration,
                        facilityId: this.config.facilityId,
                        notes: appointmentData.notes
                    })
                })

                if (!response.ok) {
                    throw new Error(`Voyager API error: ${response.status}`)
                }

                const result = await response.json()
                return { success: true, voyagerId: result.appointmentId }
            }

            // Option 2: HL7 message (SIU^S12)
            const hl7Message = this.generateHL7AppointmentMessage(appointmentData)
            // Send via MLLP client
            // const response = await this.sendHL7Message(hl7Message)

            return { success: true }

        } catch (error) {
            console.error('Error creating Voyager appointment:', error)
            throw error
        }
    }

    /**
     * Generate HL7 appointment message
     */
    private generateHL7AppointmentMessage(appointmentData: any): string {
        const now = new Date()
        const messageId = `AXI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // MSH - Message Header
        const msh = `MSH|^~\\&|AXIS_BOOKING|AXIS|VOYAGER|VOYAGER|${this.formatHL7Date(now)}||SIU^S12|${messageId}|P|2.5`

        // PID - Patient Identification
        const pid = `PID|1||${appointmentData.patient.id}^^^AXIS||${appointmentData.patient.lastName}^${appointmentData.patient.firstName}||${this.formatHL7Date(appointmentData.patient.dateOfBirth)}|${appointmentData.patient.email}`

        // SCH - Schedule Information
        const sch = `SCH|1||${appointmentData.id}||BOOKED|${this.formatHL7Date(appointmentData.scheduledDatetime)}|${appointmentData.duration}`

        // ORC - Order Information
        const orc = `ORC|NW|||||||${this.formatHL7Date(now)}`

        // OBR - Observation Request
        const obr = `OBR|1||${appointmentData.id}||${appointmentData.service.name}||${this.formatHL7Date(now)}|||||||||||||||||||${appointmentData.bodyPart.name}`

        return [msh, pid, sch, orc, obr].join('\r')
    }

    private formatHL7Date(date: Date): string {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0]
    }
}

// Export a configured instance
export const voyagerClient = new VoyagerClient({
    baseUrl: process.env.VOYAGER_API_URL || '',
    username: process.env.VOYAGER_USERNAME || '',
    password: process.env.VOYAGER_PASSWORD || '',
    facilityId: process.env.VOYAGER_FACILITY_ID || 'AXIS'
}) 