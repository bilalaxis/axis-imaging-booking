"use client"

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { PatientDetailsForm } from '@/components/ui/patient-details-form';
import { PatientDetailsForm as PatientDetailsFormData } from '@/lib/validations/booking';

// Type definitions
interface Service {
    id: string;
    name: string;
}

interface BodyPart {
    id: string;
    name: string;
}

interface AvailabilitySlot {
    date: string;
    slots: { time: string; available: boolean }[];
}

const AxisBookingForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
    const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
    const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [daySlots, setDaySlots] = useState<{ time: string; available: boolean }[]>([]);

    // Loading states
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBodyParts, setIsLoadingBodyParts] = useState(false);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [bookingConfirmation, setBookingConfirmation] = useState<{ bookingId: string; scheduledDatetime: string; status: string; voyagerId: string | null } | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoadingServices(true);
            try {
                const response = await fetch('/api/services');
                if (!response.ok) throw new Error('Failed to fetch services');
                const data = await response.json();
                setServices(data.services);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setIsLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    useEffect(() => {
        const fetchBodyParts = async () => {
            if (!selectedService) {
                setBodyParts([]);
                return;
            }
            setIsLoadingBodyParts(true);
            try {
                const response = await fetch(`/api/services/${selectedService.id}/body-parts`);
                if (!response.ok) throw new Error('Failed to fetch body parts');
                setBodyParts(await response.json());
            } catch (error) {
                console.error("Error fetching body parts:", error);
            } finally {
                setIsLoadingBodyParts(false);
            }
        };

        if (selectedService?.name !== 'DEXA / Bone Density') {
            fetchBodyParts();
        } else {
            setBodyParts([]);
            setSelectedBodyPart(null);
        }
    }, [selectedService]);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedService) {
                setAvailability([]);
                return;
            }
            setIsLoadingAvailability(true);
            try {
                const response = await fetch(`/api/availability?service_id=${selectedService.id}`);
                if (!response.ok) throw new Error('Failed to fetch availability');
                const data = await response.json();
                setAvailability(data.availability);
            } catch (error) {
                console.error("Error fetching availability:", error);
            } finally {
                setIsLoadingAvailability(false);
            }
        };
        fetchAvailability();
    }, [selectedService]);

    useEffect(() => {
        const slots = availability.find(day => day.date === selectedDate)?.slots || [];
        setDaySlots(slots);
    }, [selectedDate, availability]);

    const handleNextStep = () => {
        if (isStepComplete(currentStep)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const isStepComplete = (step: number) => {
        switch (step) {
            case 1:
                if (selectedService?.name === 'DEXA / Bone Density') {
                    return !!selectedService;
                }
                return !!selectedService && !!selectedBodyPart;
            case 2:
                return !!selectedDate && !!selectedTime;
            default:
                return false;
        }
    };

    const handlePatientDetailsSubmit = async (data: PatientDetailsFormData) => {
        if (!selectedService || !selectedDate || !selectedTime) {
            setSubmissionError("Please ensure service, date, and time are selected.");
            return;
        }

        setIsSubmitting(true);
        setSubmissionError(null);

        const scheduledDatetime = new Date(`${selectedDate}T${selectedTime}`);
        const bookingPayload = {
            serviceId: selectedService.id,
            bodyPartId: selectedBodyPart?.id,
            scheduledDatetime: scheduledDatetime.toISOString(),
            patientDetails: data,
            notes: data.notes,
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingPayload),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Booking failed');
            }
            const result = await response.json();
            setBookingConfirmation(result.appointment);
            setCurrentStep(4);
        } catch (error) {
            setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold">Book a Radiology Appointment</h1>
                <p className="text-gray-600">Select your medical imaging scan</p>
            </div>

            {currentStep === 1 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>What service do you need?</Label>
                        <Select
                            onValueChange={(serviceId) => {
                                const service = services.find(s => s.id === serviceId) || null;
                                setSelectedService(service);
                                setSelectedBodyPart(null);
                            }}
                            value={selectedService?.id || ''}
                            disabled={isLoadingServices}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={isLoadingServices ? "Loading..." : "Please select"} />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(service => (
                                    <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedService && selectedService.name !== 'DEXA / Bone Density' && (
                        <div className="space-y-2">
                            <Label>Which body part requires this service?</Label>
                            <Select
                                onValueChange={(bodyPartId) => {
                                    const part = bodyParts.find(p => p.id === bodyPartId) || null;
                                    setSelectedBodyPart(part);
                                }}
                                value={selectedBodyPart?.id || ''}
                                disabled={isLoadingBodyParts}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingBodyParts ? "Loading..." : "Please select"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {bodyParts.map(part => (
                                        <SelectItem key={part.id} value={part.id}>{part.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}

            {currentStep === 2 && (() => {
                return (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Select Date and Time</h2>
                        {isLoadingAvailability ? (
                            <p>Loading availability...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate ? parseISO(selectedDate) : undefined}
                                    onSelect={(date) => setSelectedDate(date ? format(date, 'yyyy-MM-dd') : '')}
                                    disabled={(date) => !availability.some(slot => slot.date === format(date, 'yyyy-MM-dd')) || (date ? date < new Date() : false)}
                                />
                                <div className="grid grid-cols-3 gap-2 h-fit">
                                    {daySlots.map((slot) => (
                                        <Button
                                            key={slot.time}
                                            variant={selectedTime === slot.time ? 'default' : 'outline'}
                                            onClick={() => setSelectedTime(slot.time)}
                                            disabled={!slot.available}
                                        >
                                            {slot.time}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })()}

            {currentStep === 3 && (
                <PatientDetailsForm onSubmit={handlePatientDetailsSubmit} isSubmitting={isSubmitting} />
            )}

            {currentStep === 4 && bookingConfirmation && (
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded text-center">
                    <h2 className="text-2xl font-semibold mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-700">Thank you for booking with Axis Imaging.</p>
                    <div className="mt-4 text-left bg-white p-4 rounded-lg border">
                        <p><strong>Booking Reference:</strong> <span className="font-mono">{bookingConfirmation.bookingId}</span></p>
                        <p><strong>Scheduled for:</strong> <span className="font-mono">{new Date(bookingConfirmation.scheduledDatetime).toLocaleString()}</span></p>
                        <p><strong>Status:</strong> <span className="font-mono capitalize">{bookingConfirmation.status}</span></p>
                        {bookingConfirmation.voyagerId && (
                            <p><strong>Voyager ID:</strong> <span className="font-mono">{bookingConfirmation.voyagerId}</span></p>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-between">
                {currentStep > 1 && currentStep < 4 && (
                    <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                        Back
                    </Button>
                )}
                <div />
                {currentStep < 3 && (
                    <Button onClick={handleNextStep} disabled={!isStepComplete(currentStep)}>
                        Next
                    </Button>
                )}
                {currentStep === 3 && (
                    <Button form="patient-details-form" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Booking'}
                    </Button>
                )}
            </div>

            {submissionError && <p className="text-red-500 mt-4 text-center">{submissionError}</p>}
        </div>
    );
};

export default AxisBookingForm;