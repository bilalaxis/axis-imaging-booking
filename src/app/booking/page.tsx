"use client"
import React, { useState, useEffect } from 'react';
import { ChevronDown, Calendar, MapPin, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Types
interface Service {
    id: string;
    name: string;
    code: string | null;
    category: string;
    description: string | null;
    durationMinutes: number;
}

interface BodyPart {
    id: string;
    name: string;
    preparationText: string | null;
    serviceId: string;
}

interface Availability {
    date: string;
    slots: { time: string; available: boolean }[];
}

interface PatientData {
    title: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    email: string;
    mobile: string;
}

const AxisBookingForm = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [services, setServices] = useState<Service[]>([]);
    const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingBodyParts, setIsLoadingBodyParts] = useState(false);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [patientData, setPatientData] = useState<PatientData>({
        title: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        email: '',
        mobile: '',
    });
    const [referralFile, setReferralFile] = useState<File | null>(null);
    const [referralUrl, setReferralUrl] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch('/api/services');
                if (!response.ok) {
                    throw new Error('Failed to fetch services');
                }
                const data = await response.json();
                setServices(data);
            } catch (error) {
                console.error(error);
                // Handle error state in UI
            } finally {
                setIsLoadingServices(false);
            }
        };

        fetchServices();
    }, []);

    useEffect(() => {
        if (selectedService) {
            const fetchBodyParts = async () => {
                setIsLoadingBodyParts(true);
                setBodyParts([]); // Clear previous body parts
                try {
                    const response = await fetch(`/api/services/${selectedService.id}/body-parts`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch body parts');
                    }
                    const data = await response.json();
                    setBodyParts(data);
                } catch (error) {
                    console.error(error);
                    // Handle error state in UI
                } finally {
                    setIsLoadingBodyParts(false);
                }
            };

            const fetchAvailability = async () => {
                setIsLoadingAvailability(true);
                setAvailability([]);
                try {
                    const response = await fetch(`/api/availability?service_id=${selectedService.id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch availability');
                    }
                    const data = await response.json();
                    setAvailability(data.availability);
                } catch (error) {
                    console.error(error)
                } finally {
                    setIsLoadingAvailability(false);
                }
            };

            fetchBodyParts();
            fetchAvailability();
        } else {
            setBodyParts([]);
            setAvailability([]);
        }
    }, [selectedService]);

    const formatPreparationText = (text: string) => {
        return text.split('\n').map((line, index) => (
            <p key={index} className={line.startsWith('-') ? 'ml-4' : 'mb-2'}>
                {line}
            </p>
        ));
    };

    const ServiceSelector = () => (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Book a Radiology Appointment</h1>
                <p className="text-xl text-gray-600">Select your medical imaging scan</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        What service do you need?
                    </label>
                    <div className="relative">
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={selectedService?.id || ''}
                            onChange={(e) => {
                                const service = services.find(s => s.id === e.target.value);
                                setSelectedService(service || null);
                                setSelectedBodyPart(null);
                            }}
                            disabled={isLoadingServices}
                        >
                            <option value="">{isLoadingServices ? 'Loading services...' : 'Please select'}</option>
                            {services.map(service => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                {selectedService && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Which body part requires this service?
                        </label>
                        <div className="relative">
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={selectedBodyPart?.id || ''}
                                onChange={(e) => {
                                    const bodyPart = bodyParts.find(bp => bp.id === e.target.value);
                                    setSelectedBodyPart(bodyPart || null);
                                }}
                                disabled={isLoadingBodyParts || !selectedService}
                            >
                                <option value="">{isLoadingBodyParts ? 'Loading...' : 'Please select'}</option>
                                {bodyParts.map(bodyPart => (
                                    <option key={bodyPart.id} value={bodyPart.id}>
                                        {bodyPart.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        </div>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <details className="cursor-pointer">
                        <summary className="text-blue-800 font-medium flex items-center">
                            <ChevronDown className="mr-2" size={16} />
                            What if I can&apos;t find my scan in the service list?
                        </summary>
                        <div className="mt-3 text-blue-700">
                            <p>If you can&apos;t find your scan in the service list or are uncertain, please contact us directly at <span className="font-medium">(03) 9123 4567</span> or email <span className="font-medium">bookings@axisimaging.com.au</span> to discuss your specific requirements.</p>
                        </div>
                    </details>
                </div>

                {selectedService && selectedBodyPart && (
                    <button
                        onClick={() => setCurrentStep(2)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                        Continue
                        <ArrowRight className="ml-2" size={20} />
                    </button>
                )}
            </div>

            <div className="mt-12 bg-gray-50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Book now for seamless care when you need it most</h2>
                <p className="text-gray-700 mb-4">
                    Scheduling your radiology appointment online with Axis Imaging is quick, easy and convenient.
                    Choose a date, time and complete your booking in just a few simple steps.
                </p>
                <p className="text-gray-700">
                    We&apos;re here to support you with accurate and timely diagnosis, whether you need a CT scan,
                    X-ray, ultrasound, or DEXA bone density scan. Book online now, have your referral ready.
                </p>
            </div>
        </div>
    );

    const PreparationInfo = () => (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">
                    Preparation Information for {selectedService?.name} - {selectedBodyPart?.name}
                </h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <div className="prose max-w-none">
                    {selectedBodyPart && selectedBodyPart.preparationText && formatPreparationText(selectedBodyPart.preparationText)}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentStep(1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
                >
                    <ArrowLeft className="mr-2" size={20} />
                    Back
                </button>
                <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                    Accept
                </button>
            </div>
        </div>
    );

    const DateTimeSelector = () => (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Select a date and time</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <MapPin className="text-blue-600 mr-2" size={20} />
                        <span className="font-medium">Axis Imaging Mickleham</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                        <Calendar className="mr-2" size={16} />
                        <span>{selectedService?.name} - {selectedBodyPart?.name}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-blue-900 mb-4">Available Times</h3>
                <div className="mb-4">
                    <p className="font-medium text-gray-800">Axis Imaging Mickleham</p>
                    <p className="text-gray-600">123 Mickleham Drive, Mickleham VIC 3064</p>
                </div>

                <div className="space-y-4">
                    {isLoadingAvailability ? (
                        <p>Loading available times...</p>
                    ) : availability.length > 0 ? (
                        availability.map(day => (
                            <div key={day.date}>
                                <p className="font-medium text-gray-800 mb-2">{format(parseISO(day.date), 'EEEE, d MMMM')}</p>
                                <div className="flex flex-wrap gap-2">
                                    {day.slots.map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => {
                                                setSelectedTime(slot.time)
                                                setSelectedDate(day.date)
                                            }}
                                            className={`px-4 py-2 border rounded-lg transition-colors ${selectedTime === slot.time && selectedDate === day.date
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                }`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No available appointments for this service. Please check again later or contact us.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
                >
                    <ArrowLeft className="mr-2" size={20} />
                    Back
                </button>
                {selectedTime && selectedDate && (
                    <button
                        onClick={() => setCurrentStep(4)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
                    >
                        Continue
                        <ArrowRight className="ml-2" size={20} />
                    </button>
                )}
            </div>
        </div>
    );

    const handleFileUpload = async (file: File) => {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/referrals/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                throw new Error('Failed to upload file')
            }

            const data = await response.json()
            setReferralUrl(data.url)
            return data.url
        } catch (error) {
            console.error('Error uploading file:', error)
            throw error
        }
    }

    const handleBookingSubmission = async () => {
        if (!selectedService || !selectedBodyPart || !selectedTime || !selectedDate) {
            alert('Please complete all required fields')
            return
        }

        setIsSubmitting(true)

        try {
            // Upload referral file if provided
            let finalReferralUrl = referralUrl
            if (referralFile && !referralUrl) {
                finalReferralUrl = await handleFileUpload(referralFile)
            }

            // Create scheduled datetime
            const scheduledDatetime = new Date(`${selectedDate}T${selectedTime}:00`)

            // Submit booking
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    bodyPartId: selectedBodyPart.id,
                    scheduledDatetime: scheduledDatetime.toISOString(),
                    patient: patientData,
                    referralUrl: finalReferralUrl,
                    notes: notes,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create booking')
            }

            const bookingData = await response.json()

            // Move to confirmation step
            setCurrentStep(5)

        } catch (error) {
            console.error('Error submitting booking:', error)
            alert(`Failed to submit booking: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const PatientDetails = () => (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-2">Your details</h1>
                <p className="text-gray-600">If you are booking on behalf of someone else, please enter their details here.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Personal Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <select
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={patientData.title}
                                onChange={(e) => setPatientData({ ...patientData, title: e.target.value })}
                            >
                                <option value="">Please select</option>
                                <option value="Mr">Mr</option>
                                <option value="Ms">Ms</option>
                                <option value="Mrs">Mrs</option>
                                <option value="Dr">Dr</option>
                            </select>
                        </div>
                        <div></div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First name*</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter first name"
                                value={patientData.firstName}
                                onChange={(e) => setPatientData({ ...patientData, firstName: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last name*</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter last name"
                                value={patientData.lastName}
                                onChange={(e) => setPatientData({ ...patientData, lastName: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth*</label>
                            <input
                                type="date"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={patientData.dateOfBirth}
                                onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Contact Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email address*</label>
                            <input
                                type="email"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter email address"
                                value={patientData.email}
                                onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number*</label>
                            <input
                                type="tel"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter mobile number"
                                value={patientData.mobile}
                                onChange={(e) => setPatientData({ ...patientData, mobile: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Referral*</h3>
                    <p className="text-gray-600 mb-4">You need to provide a referral from your practitioner to book an appointment.</p>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                        <input
                            type="file"
                            id="referral-upload"
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    setReferralFile(file)
                                }
                            }}
                        />
                        <label htmlFor="referral-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer">
                            {referralFile ? referralFile.name : 'Upload referral'}
                        </label>
                        {referralFile && (
                            <p className="text-sm text-green-600 mt-2">
                                ✓ {referralFile.name} selected
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            Accepted formats: JPG, PNG, PDF (Max 10MB)
                        </p>
                    </div>

                    <details className="mt-4 cursor-pointer">
                        <summary className="text-blue-600 font-medium">How do I upload my referral?</summary>
                        <div className="mt-2 text-gray-600 text-sm">
                            <p>Take a clear photo of your referral letter or scan it as a PDF. Ensure all text is readable and the image is well-lit.</p>
                        </div>
                    </details>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Please provide any information relevant to your appointment. E.g. if you need assistance upon arrival, have allergies, mobility issues, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-between mt-8">
                <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
                    disabled={isSubmitting}
                >
                    <ArrowLeft className="mr-2" size={20} />
                    Back
                </button>
                <button
                    onClick={handleBookingSubmission}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="ml-2" size={20} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const ConfirmationStep = () => {
        const appointmentDate = selectedDate && selectedTime
            ? format(parseISO(selectedDate), 'EEEE, d MMMM')
            : 'Date not selected'

        return (
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-4">Appointment Summary</h3>
                    <div className="text-left space-y-2">
                        <p><span className="font-medium">Service:</span> {selectedService?.name}</p>
                        <p><span className="font-medium">Body Part:</span> {selectedBodyPart?.name}</p>
                        <p><span className="font-medium">Preferred Time:</span> {appointmentDate} at {selectedTime}</p>
                        <p><span className="font-medium">Location:</span> Axis Imaging Mickleham</p>
                        <p><span className="font-medium">Duration:</span> Approximately {selectedService?.durationMinutes} minutes</p>
                        <p><span className="font-medium">Patient:</span> {patientData.firstName} {patientData.lastName}</p>
                        <p><span className="font-medium">Contact:</span> {patientData.email}</p>
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    <p>Reference: AXI-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p className="mt-2">A confirmation email has been sent to your email address.</p>
                </div>
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded mr-3"></div>
                        <span className="text-xl font-bold text-blue-900">Axis Imaging</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        Step {currentStep} of 5
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                {currentStep === 1 && <ServiceSelector />}
                {currentStep === 2 && <PreparationInfo />}
                {currentStep === 3 && <DateTimeSelector />}
                {currentStep === 4 && <PatientDetails />}
                {currentStep === 5 && <ConfirmationStep />}
            </div>
        </div>
    );
};

export default AxisBookingForm;