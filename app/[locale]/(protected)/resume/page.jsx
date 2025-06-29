'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Steps } from 'primereact/steps';
import { Card } from 'primereact/card';
import { RadioButton } from 'primereact/radiobutton';
import { Dropdown } from 'primereact/dropdown';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from 'primereact/checkbox';
import { useRouter } from 'next/navigation';
import debounce from 'lodash/debounce';
import { useSession } from 'next-auth/react';
import { ProgressSpinner } from 'primereact/progressspinner';


const ResumeBuilder = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    // Update formData structure
    const [formData, setFormData] = useState({
        purpose: '',
        targetLanguage: '',
        description: '',
        documentPreferences: {
            coverLetter: false,
            motivationLetter: false,
            recommendationLetter: false
        }
    });

    const { data: session } = useSession();
    console.log(session);
    const userToken = session?.accessToken;



    const toast = useRef(null);
    const router = useRouter();

    const steps = [
        { label: 'Purpose' },
        { label: 'Target Details' },
        { label: 'Additional Documents' },
        { label: 'Final Resume' }
    ];

    const languages = [
        { label: 'English', value: 'English' },
        { label: 'German', value: 'German' },
        { label: 'French', value: 'French' },
        { label: 'Spanish', value: 'Spanish' },
        { label: 'Italian', value: 'Italian' },
        { label: 'Arabic', value: 'Arabic' },
        { label: 'Portuguese', value: 'Portuguese' },
        { label: 'Russian', value: 'Russian' },
        { label: 'Chinese', value: 'Chinese' },
        { label: 'Japanese', value: 'Japanese' }


    ];

    const StepContent = ({ children }) => (
        <div className="p-4">
            {children}
        </div>
    );

    const renderStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <StepContent>
                        <h2 className="text-2xl font-bold mb-4">What&apos;s your purpose?</h2>
                        <div className="flex flex-column gap-4">
                            {['job', 'scholarship'].map((type) => (
                                <motion.div
                                    key={type}
                                    whileHover={{ scale: 1.02 }}
                                    className="surface-card p-4 border-round shadow-1 cursor-pointer"
                                    onClick={() => setFormData({ ...formData, purpose: type })}
                                >
                                    <RadioButton
                                        inputId={type}
                                        name="purpose"
                                        value={type}
                                        onChange={(e) => setFormData({ ...formData, purpose: e.value })}
                                        checked={formData.purpose === type}
                                        required
                                    />
                                    <label htmlFor={type} className="ml-2 font-medium capitalize">
                                        {type} Application
                                    </label>
                                </motion.div>
                            ))}
                        </div>
                    </StepContent>
                );

            case 1:
                return (
                    <StepContent>
                        <h2 className="text-2xl font-bold mb-4">Target Details</h2>
                        <div className="flex flex-column gap-4">
                            <div className="field">
                                <label className="block mb-2">Target Language</label>
                                <Dropdown
                                    value={formData.targetLanguage}
                                    options={languages}
                                    onChange={(e) => setFormData({ ...formData, targetLanguage: e.value })}
                                    placeholder="Select Language"
                                    className="w-full"
                                />
                            </div>
                            <div className="field">
                                <label className="block mb-2">
                                    {formData.purpose === 'job' ? 'Job Description' : 'Scholarship Details'}
                                </label>
                                <div className="flex flex-column gap-2">
                                    <InputTextarea
                                        key="description-textarea"
                                        value={formData.description || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFormData(prev => ({ ...prev, description: value }));
                                        }}
                                        rows={5}
                                        className="w-full"
                                        placeholder={`Enter your ${formData.purpose === 'job' ? 'job description' : 'scholarship details'} here...`}
                                    />
                                    <Button
                                        icon="pi pi-paste"
                                        label="Paste"
                                        className="p-button-outlined"
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText();
                                                setFormData(prev => ({ ...prev, description: text }));
                                            } catch (err) {
                                                console.error('Failed to read clipboard:', err);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </StepContent>

                );



            case 2:
                return (
                    <StepContent>
                        <h2 className="text-2xl font-bold mb-4">Which documents would you like to generate?</h2>
                        <div className="flex flex-column gap-4">
                            {[
                                {
                                    id: 'coverLetter',
                                    label: 'Cover Letter',
                                    description: 'A professional letter introducing your qualifications'
                                },
                                {
                                    id: 'motivationLetter',
                                    label: 'Motivation Letter',
                                    description: 'Express your motivation and goals'
                                },
                                {
                                    id: 'recommendationLetter',
                                    label: 'Recommendation Letter Template',
                                    description: 'A template for your recommender'
                                }
                            ].map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    whileHover={{ scale: 1.02 }}
                                    className={`surface-card p-4 border-round shadow-1 cursor-pointer ${formData.documentPreferences[doc.id] ? 'border-primary border-2' : ''
                                        }`}
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            documentPreferences: {
                                                ...formData.documentPreferences,
                                                [doc.id]: !formData.documentPreferences[doc.id]
                                            }
                                        });
                                    }}
                                >
                                    <div className="flex align-items-center justify-content-between">
                                        <div className="flex flex-column gap-2">
                                            <div className="flex align-items-center">
                                                <Checkbox
                                                    checked={formData.documentPreferences[doc.id]}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            documentPreferences: {
                                                                ...formData.documentPreferences,
                                                                [doc.id]: e.checked
                                                            }
                                                        });
                                                    }}
                                                />
                                                <label className="ml-2 font-medium text-lg">{doc.label}</label>
                                            </div>
                                            <span className="text-500 ml-6">{doc.description}</span>
                                        </div>
                                        {formData.documentPreferences[doc.id] && (
                                            <i className="pi pi-check text-primary text-xl"></i>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </StepContent>
                );


            case 3:
                return (
                    <StepContent>
                        <h2 className="text-2xl font-bold mb-4">Upload Your Resume</h2>
                        <FileUpload
                            mode="advanced"
                            accept=".pdf,.doc,.docx,.txt"
                            maxFileSize={5000000}
                            customUpload
                            uploadHandler={handleFinalSubmit}
                            chooseLabel="Select Resume"
                            className="w-full"
                        />
                    </StepContent>
                );
        }
    };

    const handleFinalSubmit = async (event) => {
        try {
            // Ensure a file is selected
            if (!event.files || event.files.length === 0) {
                throw new Error('No file selected');
            }

            // Create FormData and append the file and metadata
            const finalFormData = new FormData();
            finalFormData.append('resume', event.files[0]);
            finalFormData.append('formData', JSON.stringify(formData));

            // Debugging: Log FormData contents
            for (let [key, value] of finalFormData.entries()) {
                console.log(key, value);
            }

            setLoading(true);

            // Send the request
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/resumes/generate_from_job_desc/`,
                {
                    method: 'POST',
                    body: finalFormData, // Use finalFormData, not formData
                    headers: {
                        'Authorization': `Bearer ${userToken}` // Add auth if needed
                    }
                }
            );

            // Handle response
            if (!response.ok) {
                setLoading(false);
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();
            router.push(`/main/editor/${data.id}`);
        } catch (error) {
            setLoading(false);
            console.error('Upload Error:', error); // Log the actual error
            toast.current.show({
                severity: 'error',
                summary: 'Upload Failed',
                detail: error.message || 'Please try again'
            });
        }
    };




    // if (session?.accessToken === undefined ){
    //     router.push('/login');
    // }

    return loading ? (
        <div className="flex justify-content-center align-items-center min-h-screen">
            <ProgressSpinner />
        </div>
    ) :
        (
            <div className="surface-ground px-4 py-8 md:px-6 lg:px-8 min-h-screen">
                <Toast ref={toast} />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-content-center"
                >
                    <Card className="w-full md:w-8 lg:w-6">
                        <Steps
                            model={steps}
                            activeIndex={activeIndex}
                            onSelect={(e) => setActiveIndex(e.index)}
                            className="mb-6"
                        />
                        <AnimatePresence mode="wait">
                            {renderStep()}
                        </AnimatePresence>
                        <div className="flex justify-content-between mt-4">
                            <Button
                                label="Back"
                                icon="pi pi-angle-left"
                                onClick={() => setActiveIndex(activeIndex - 1)}
                                disabled={activeIndex === 0}
                                className="p-button-secondary"
                            />
                            <Button
                                label={activeIndex === steps.length - 1 ? 'Submit' : 'Next'}
                                icon="pi pi-angle-right"
                                iconPos="right"
                                onClick={() => setActiveIndex(activeIndex + 1)}
                                disabled={activeIndex === steps.length - 1}
                            />
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
};

export default ResumeBuilder;
