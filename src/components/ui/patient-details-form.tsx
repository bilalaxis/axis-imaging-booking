'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientDetailsSchema, PatientDetailsForm as PatientDetailsFormData } from '@/lib/validations/booking';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';

interface PatientDetailsFormProps {
    onSubmit: (data: PatientDetailsFormData) => void;
    isSubmitting: boolean;
    onFileSelect: (file: File | null) => void;
    referralFile: File | null;
}

export const PatientDetailsForm: React.FC<PatientDetailsFormProps> = ({ onSubmit, isSubmitting, onFileSelect, referralFile }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<PatientDetailsFormData>({
        resolver: zodResolver(patientDetailsSchema),
        defaultValues: {
            notes: "",
            email: "",
        }
    });

    return (
        <form id="patient-details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name*</Label>
                        <Input id="firstName" {...register('firstName')} />
                        {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name*</Label>
                        <Input id="lastName" {...register('lastName')} />
                        {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth*</Label>
                        <Input id="dateOfBirth" type="date" {...register('dateOfBirth', { valueAsDate: true })} />
                        {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address*</Label>
                        <Input id="email" type="email" {...register('email')} />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number*</Label>
                        <Input id="mobile" {...register('mobile')} />
                        {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile.message}</p>}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Referral*</h3>
                <p className="text-gray-600 mb-4">You need to provide a referral from your practitioner to book an appointment.</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto text-gray-400 mb-4" size={40} />
                    <input
                        type="file"
                        id="referral-upload"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => onFileSelect(e.target.files ? e.target.files[0] : null)}
                    />
                    <label htmlFor="referral-upload" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer">
                        {referralFile ? 'Change file' : 'Upload referral'}
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
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" {...register('notes')} placeholder="Please provide any information relevant to your appointment..." />
                {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
            </div>

            {/* This button is hidden and triggered by the parent component */}
            <Button type="submit" className="hidden" disabled={isSubmitting}>Submit</Button>
        </form>
    );
}; 