import React from 'react';
import { Card } from 'primereact/card';
import Link from 'next/link';

const PrivacyPolicyPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4" style={{ maxWidth: '960px' }}>
                <Card className="shadow-lg">
                    <div className="p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                        <p className="text-gray-600 mb-8">Last updated: August 25, 2025</p>

                        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                                
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Personal Information You Provide</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li>Name, email address, and contact information.</li>
                                    <li>Resume content, including work experience, skills, and educational background.</li>
                                    <li>Career objectives, job descriptions, and other job application materials.</li>
                                    <li>Account credentials and profile information.</li>
                                    <li>Payment information for subscription services.</li>
                                </ul>

                                <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">Data Collected Automatically</h3>
                                <ul className="list-disc pl-6 space-y-1">
                                    <li><strong>Usage Data:</strong> Information on how you interact with our service and which features you use.</li>
                                    <li><strong>Device Information:</strong> Your device type, browser, operating system, and screen resolution.</li>
                                    <li><strong>Log Data:</strong> IP address, access times, and pages visited.</li>
                                    <li><strong>Cookies:</strong> Data collected through cookies and similar tracking technologies.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>To provide, maintain, and improve our AI-powered resume and portfolio services.</li>
                                    <li>To analyze ATS compatibility and provide optimization recommendations.</li>
                                    <li>To generate personalized career documents, cover letters, and suggestions.</li>
                                    <li>To communicate with you about your account, service updates, and promotional offers.</li>
                                    <li>To process payments and manage your subscription.</li>
                                    <li>To comply with legal obligations and prevent fraud or abuse.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. AI Processing and Machine Learning</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>We use the content you provide to power our AI models and generate relevant outputs for you.</li>
                                    <li>To improve our services, we may use anonymized and aggregated data to train our machine learning models.</li>
                                    <li>We do not use your personally identifiable information for model training without your explicit consent.</li>
                                    <li>We do not share your individual resume content with third-party AI providers for their own use.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
                                <p>We do not sell your personal information. We may share your data only in these limited circumstances:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Service Providers:</strong> With trusted third parties who help us operate our service (e.g., payment processors, cloud hosting).</li>
                                    <li><strong>Legal Requirements:</strong> If required by law, court order, or other governmental request.</li>
                                    <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
                                    <li><strong>With Your Consent:</strong> When you explicitly authorize us to share specific information.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>We implement industry-standard security measures, including encryption, to protect your data in transit and at rest.</li>
                                    <li>Access to personal information is restricted to authorized personnel on a need-to-know basis.</li>
                                    <li>We conduct regular security audits and have monitoring systems to protect against unauthorized access.</li>
                                    <li>We maintain incident response plans to address potential data breaches.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
                                <p>
                                    We retain your personal data as long as your account is active or as needed to provide you with our services. We may also retain data to comply with legal obligations, resolve disputes, and enforce our agreements. You can delete your account and associated data at any time from your account settings.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Data Rights and Choices</h2>
                                <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
                                    <li><strong>Right to Rectification:</strong> You can correct or update inaccurate information in your account settings.</li>
                                    <li><strong>Right to Erasure:</strong> You can request the deletion of your personal data.</li>
                                    <li><strong>Right to Object:</strong> You can object to our processing of your personal data for certain purposes.</li>
                                    <li><strong>Right to Data Portability:</strong> You can request your data in a machine-readable format.</li>
                                </ul>
                                <p>To exercise these rights, please contact us at the email address below.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Childrens Privacy</h2>
                                <p>
                                    Our service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without parental consent, we will take steps to remove that information.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Privacy Policy</h2>
                                <p>
                                    We may update this policy from time to time. We will notify you of any significant changes by email or through a notice on our website. Your continued use of the service after such changes constitutes your acceptance of the new policy.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
                                <p>
                                    If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
                                </p>
                                <ul className="list-none space-y-1">
                                    <li>Email: <a href="mailto:privacy@careerflow.ai" className="text-blue-600 hover:text-blue-800">privacy@careerflow.ai</a></li>
                                    <li>Via our <Link href="/contact" className="text-blue-600 hover:text-blue-800">Contact Page</Link></li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;