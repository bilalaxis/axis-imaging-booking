"use client"

import React, { useState, useEffect } from 'react';
import { ChevronDown, ArrowLeft, ArrowRight, MapPin, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { PatientDetailsForm } from '@/components/ui/patient-details-form';
import { PatientDetailsForm as PatientDetailsFormData } from '@/lib/validations/booking';
import { Button } from '@/components/ui/button';

// Type definitions
interface Service {
    id: string;
    name: string;
    description: string | null;
    durationMinutes: number;
}

interface BodyPart {
    id: string;
    name: string;
    preparationText: string | null;
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
    const [questionnaire, setQuestionnaire] = useState({ kidneyDisease: '', diabetic: '', metformin: '' });

    // Loading states
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBodyParts, setIsLoadingBodyParts] = useState(false);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [bookingConfirmation, setBookingConfirmation] = useState<{ bookingId: string; scheduledDatetime: string; status: string; voyagerId: string | null } | null>(null);
    const [referralFile, setReferralFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoadingServices(true);
            try {
                const response = await fetch('/api/services');
                if (!response.ok) throw new Error('Failed to fetch services');
                const data = await response.json();
                setServices(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching services:", error);
                setServices([]);
            } finally {
                setIsLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    useEffect(() => {
        const fetchBodyParts = async () => {
            if (!selectedService || selectedService.name === 'DEXA / Bone Density') {
                setBodyParts([]);
                setSelectedBodyPart(null);
                return;
            }
            setIsLoadingBodyParts(true);
            try {
                const response = await fetch(`/api/services/${selectedService.id}/body-parts`);
                if (!response.ok) throw new Error('Failed to fetch body parts');
                const data = await response.json();
                setBodyParts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching body parts:", error);
                setBodyParts([]);
            } finally {
                setIsLoadingBodyParts(false);
            }
        };
        fetchBodyParts();
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
                setAvailability(data.availability || []);
            } catch (error) {
                console.error("Error fetching availability:", error);
                setAvailability([]);
            } finally {
                setIsLoadingAvailability(false);
            }
        };
        fetchAvailability();
    }, [selectedService]);

    const handleNextStep = () => setCurrentStep(currentStep + 1);
    const handlePrevStep = () => setCurrentStep(currentStep - 1);

    const handleQuestionnaireChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuestionnaire({ ...questionnaire, [e.target.name]: e.target.value });
    };

    const formatPreparationText = (text: string | null) => {
        if (!text) return <p>No specific preparation instructions are required for this scan.</p>;
        return text.split('\n').map((line, index) => (
            <p key={index} className="mb-2">
                {line}
            </p>
        ));
    };

    const handleBookingSubmit = async (data: PatientDetailsFormData) => {
        setIsSubmitting(true);
        setSubmissionError(null);

        let uploadedReferralUrl = '';
        if (referralFile) {
            const formData = new FormData();
            formData.append('file', referralFile);
            try {
                const res = await fetch('/api/referrals/upload', {
                    method: 'POST',
                    body: formData,
                });
                const result = await res.json();
                if (!res.ok) throw new Error(result.error || 'Upload failed');
                uploadedReferralUrl = result.url;
            } catch (error) {
                setSubmissionError(error instanceof Error ? error.message : 'Failed to upload referral.');
                setIsSubmitting(false);
                return;
            }
        }

        const scheduledDatetime = new Date(`${selectedDate}T${selectedTime}`);
        const bookingPayload = {
            serviceId: selectedService!.id,
            bodyPartId: selectedBodyPart?.id,
            scheduledDatetime: scheduledDatetime.toISOString(),
            patientDetails: data,
            referralUrl: uploadedReferralUrl,
            notes: data.notes,
            questionnaire,
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
            setBookingConfirmation(result);
            handleNextStep();
        } catch (error) {
            setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER STEPS ---
    const ServiceSelector = () => (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Book a Radiology Appointment</h1>
                <p className="text-xl text-gray-600">Select your medical imaging scan</p>
            </div>

            <div className="space-y-6 bg-white p-8 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What service do you need?</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value={selectedService?.id || ''}
                            onChange={(e) => {
                                const service = services.find(s => s.id === e.target.value) || null;
                                setSelectedService(service);
                            }}
                            disabled={isLoadingServices}
                        >
                            <option value="">{isLoadingServices ? "Loading..." : "Please select"}</option>
                            {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                {selectedService && selectedService.name !== 'DEXA / Bone Density' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Which body part requires this service?</label>
                        <div className="relative">
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                value={selectedBodyPart?.id || ''}
                                onChange={(e) => {
                                    const bodyPart = bodyParts.find(bp => bp.id === e.target.value) || null;
                                    setSelectedBodyPart(bodyPart);
                                }}
                                disabled={isLoadingBodyParts}
                            >
                                <option value="">{isLoadingBodyParts ? "Loading..." : "Please select"}</option>
                                {bodyParts.map(part => <option key={part.id} value={part.id}>{part.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const PreparationInfo = () => (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Preparation Information</h1>
                <p className="text-xl text-gray-600">{selectedService?.name} - {selectedBodyPart?.name}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6 prose max-w-none">
                {formatPreparationText(selectedBodyPart?.preparationText || null)}
            </div>
        </div>
    );

    const ServiceQuestionnaire = () => (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Service Questionnaire</h1>
                <p className="text-xl text-gray-600">Please answer the following questions</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6 space-y-6">
                <div>
                    <p className="font-medium text-gray-800 mb-3">1. Do you have any presence of kidney disease?</p>
                    <div className="flex gap-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="kidneyDisease" value="yes" checked={questionnaire.kidneyDisease === 'yes'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="kidneyDisease" value="no" checked={questionnaire.kidneyDisease === 'no'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div>
                    <p className="font-medium text-gray-800 mb-3">2. Are you diabetic?</p>
                    <div className="flex gap-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="diabetic" value="yes" checked={questionnaire.diabetic === 'yes'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="diabetic" value="no" checked={questionnaire.diabetic === 'no'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div>
                    <p className="font-medium text-gray-800 mb-3">3. Are you currently taking Metformin?</p>
                    <div className="flex gap-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="metformin" value="yes" checked={questionnaire.metformin === 'yes'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="radio" name="metformin" value="no" checked={questionnaire.metformin === 'no'} onChange={handleQuestionnaireChange} className="sr-only peer" />
                            <span className="w-5 h-5 rounded-full border-2 border-gray-300 grid place-items-center peer-checked:border-blue-600"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 invisible peer-checked:visible"></span></span>
                            <span>No</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    const DateTimeSelector = () => (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Select a date and time</h1>
                <p className="text-xl text-gray-600">Choose your preferred appointment slot</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between shadow">
                <div className="flex items-center">
                    <MapPin className="text-blue-600 mr-2 h-5 w-5" />
                    <span className="font-medium">Axis Imaging Mickleham</span>
                </div>
                <div className="flex items-center text-gray-600">
                    <CalendarDays className="mr-2 h-5 w-5" />
                    <span>{selectedService?.name} {selectedBodyPart ? `- ${selectedBodyPart.name}` : ''}</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Available Times</h3>
                {isLoadingAvailability ? (
                    <p>Loading available times...</p>
                ) : availability.length > 0 ? (
                    <div className="space-y-6">
                        {availability.map(({ date, slots }) => (
                            <div key={date}>
                                <p className="font-medium text-gray-800 mb-3 text-lg">
                                    {format(parseISO(date), 'EEEE, d MMMM yyyy')}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    {slots.filter(s => s.available).map(({ time }) => (
                                        <Button
                                            key={time}
                                            variant={selectedTime === time && selectedDate === date ? 'default' : 'outline'}
                                            onClick={() => {
                                                setSelectedDate(date);
                                                setSelectedTime(time);
                                            }}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No availability for the selected service. Please try another service or contact us.</p>
                )}
            </div>
        </div>
    );

    const PatientDetails = () => (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Your Details</h1>
                <p className="text-gray-600">If you are booking on behalf of someone else, please enter their details here.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <PatientDetailsForm
                    onSubmit={handleBookingSubmit}
                    isSubmitting={isSubmitting}
                    referralFile={referralFile}
                    onFileSelect={setReferralFile}
                />
            </div>
        </div>
    );

    const ConfirmationStep = () => (
        <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Booking Request Submitted</h1>
                <p className="text-gray-600">We&apos;ll contact you within 24 hours to confirm your appointment</p>
            </div>

            {bookingConfirmation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-4">Appointment Summary</h3>
                    <div className="text-left space-y-2">
                        <p><span className="font-medium">Service:</span> {selectedService?.name}</p>
                        <p><span className="font-medium">Body Part:</span> {selectedBodyPart?.name || 'N/A'}</p>
                        <p><span className="font-medium">Preferred Time:</span> {format(parseISO(bookingConfirmation.scheduledDatetime), 'EEEE, d MMMM yyyy')} at {format(parseISO(bookingConfirmation.scheduledDatetime), 'p')}</p>
                        <p><span className="font-medium">Location:</span> Axis Imaging Mickleham</p>
                        <p><span className="font-medium">Duration:</span> Approximately {selectedService?.durationMinutes} minutes</p>
                    </div>
                </div>
            )}

            <div className="text-sm text-gray-600">
                <p>Reference: {bookingConfirmation?.bookingId}</p>
                <p className="mt-2">A confirmation email has been sent to your email address.</p>
            </div>
        </div>
    );

    // --- MAIN RENDER ---
    const totalSteps = 6;
    const isContinueDisabled = () => {
        if (currentStep === 1) return !selectedService || (selectedService.name !== 'DEXA / Bone Density' && !selectedBodyPart);
        if (currentStep === 2) return false; // Always allow to continue past prep info
        if (currentStep === 3) return Object.values(questionnaire).some(v => v === '');
        if (currentStep === 4) return !selectedDate || !selectedTime;
        return true;
    };

    if (currentStep > totalSteps) {
        return <ConfirmationStep />;
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-blue-900">Axis Imaging</h1>
                </div>
            </header>

            <main className="py-10">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
                    </div>

                    {currentStep === 1 && <ServiceSelector />}
                    {currentStep === 2 && <PreparationInfo />}
                    {currentStep === 3 && <ServiceQuestionnaire />}
                    {currentStep === 4 && <DateTimeSelector />}
                    {currentStep === 5 && <PatientDetails />}
                    {currentStep === 6 && <ConfirmationStep />}

                    <div className="flex justify-between mt-10">
                        {currentStep < totalSteps ? (
                            <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isSubmitting}>
                                <ArrowLeft className="mr-2 h-5 w-5" /> Back
                            </Button>
                        ) : <div />}
                        {currentStep < totalSteps - 1 && (
                            <Button onClick={handleNextStep} disabled={isContinueDisabled() || isSubmitting} size="lg">
                                Continue <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        )}
                        {currentStep === totalSteps - 1 && (
                            <Button form="patient-details-form" type="submit" disabled={isSubmitting || !referralFile} size="lg">
                                {isSubmitting ? 'Submitting...' : 'Submit Booking'}
                            </Button>
                        )}
                    </div>
                    {submissionError && <p className="text-red-500 mt-4 text-center">{submissionError}</p>}
                </div>
            </main>
        </div>
    );
};

export default AxisBookingForm;