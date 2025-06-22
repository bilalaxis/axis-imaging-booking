import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BookingState, Service, BodyPart, PatientDetails } from '@/types/booking'

interface BookingStore extends BookingState {
    setStep: (step: number) => void
    setService: (service: Service) => void
    setBodyPart: (bodyPart: BodyPart) => void
    setDateTime: (date: Date, time: string) => void
    setPatientDetails: (details: PatientDetails) => void
    setReferralFile: (file: File) => void
    setReferralUrl: (url: string) => void
    reset: () => void
    canProceedToStep: (step: number) => boolean
}

const initialState: BookingState = {
    step: 1,
}

export const useBookingStore = create<BookingStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setStep: (step) => set({ step }),

            setService: (service) => set({
                service,
                bodyPart: undefined, // Reset body part when service changes
                step: 2
            }),

            setBodyPart: (bodyPart) => set({
                bodyPart,
                step: 3
            }),

            setDateTime: (selectedDate, selectedTime) => set({
                selectedDate,
                selectedTime,
                step: 4
            }),

            setPatientDetails: (patientDetails) => set({
                patientDetails,
                step: 5
            }),

            setReferralFile: (referralFile) => set({ referralFile }),

            setReferralUrl: (referralUrl) => set({ referralUrl }),

            reset: () => set(initialState),

            canProceedToStep: (step) => {
                const state = get()
                switch (step) {
                    case 1:
                        return true
                    case 2:
                        return !!state.service
                    case 3:
                        return !!state.service && !!state.bodyPart
                    case 4:
                        return !!state.service && !!state.bodyPart && !!state.selectedDate && !!state.selectedTime
                    case 5:
                        return !!state.service && !!state.bodyPart && !!state.selectedDate && !!state.selectedTime && !!state.patientDetails
                    default:
                        return false
                }
            },
        }),
        {
            name: 'booking-store',
            partialize: (state) => ({
                step: state.step,
                service: state.service,
                bodyPart: state.bodyPart,
                selectedDate: state.selectedDate,
                selectedTime: state.selectedTime,
                patientDetails: state.patientDetails,
                referralUrl: state.referralUrl,
            }),
        }
    )
)