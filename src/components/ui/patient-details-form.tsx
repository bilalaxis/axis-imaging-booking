'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientDetailsSchema, PatientDetailsForm as PatientDetailsFormData } from '@/lib/validations/booking';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PatientDetailsFormProps {
    onSubmit: (data: PatientDetailsFormData) => void;
    isSubmitting: boolean;
}

export const PatientDetailsForm: React.FC<PatientDetailsFormProps> = ({ onSubmit, isSubmitting }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<PatientDetailsFormData>({
        resolver: zodResolver(patientDetailsSchema),
        defaultValues: {
            notes: "",
            email: "",
        }
    });

    return (
        <form id="patient-details-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Enter Patient Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...register('firstName')} />
                    {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...register('lastName')} />
                    {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input id="dateOfBirth" type="date" {...register('dateOfBirth', { valueAsDate: true })} />
                    {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" {...register('mobile')} />
                {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea id="notes" {...register('notes')} />
                {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
            </div>

            {/* This button is hidden and triggered by the parent component */}
            <Button type="submit" className="hidden" disabled={isSubmitting}>Submit</Button>
        </form>
    );
}; 