import React from 'react';
import { Card } from 'primereact/card';
import Link from 'next/link';

const TermsOfServicePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4" style={{ maxWidth: '960px' }}>
                <Card className="shadow-lg">
                    <div className="p-6 md:p-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                        <p className="text-gray-600 mb-8">Last updated: August 24, 2025</p>

                        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using CareerFlow AI ("we," "our," or "us"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                                <p>
                                    CareerFlow AI provides AI-powered resume building, portfolio creation, cover letter generation, and ATS compatibility checking services. Our platform uses artificial intelligence to help users create professional career documents and analyze their compatibility with Applicant Tracking Systems.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts and Registration</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>You must provide accurate, current, and complete information during registration</li>
                                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                                    <li>You agree to notify us immediately of any unauthorized use of your account</li>
                                    <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Content and Data</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>You retain ownership of all content you upload, including resumes, personal information, and career documents</li>
                                    <li>You grant us a limited license to process, analyze, and enhance your content using our AI services</li>
                                    <li>You are responsible for ensuring your content does not infringe on third-party rights</li>
                                    <li>We may use aggregated, anonymized data to improve our services</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
                                <p>You agree not to:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Use the service for any illegal or unauthorized purpose</li>
                                    <li>Upload malicious content, viruses, or harmful code</li>
                                    <li>Attempt to reverse engineer or copy our AI algorithms</li>
                                    <li>Share your account credentials with others</li>
                                    <li>Use automated tools to access the service without permission</li>
                                    <li>Upload false, misleading, or fraudulent information</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Subscription and Payment Terms</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                                    <li>All fees are non-refundable except as required by law</li>
                                    <li>We reserve the right to change pricing with 30 days advance notice</li>
                                    <li>Failure to pay may result in service suspension or termination</li>
                                    <li>You may cancel your subscription at any time through your account settings</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">7. AI Service Disclaimers</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Our AI-generated content is provided as suggestions and should be reviewed and customized</li>
                                    <li>We do not guarantee job placement or interview success</li>
                                    <li>ATS compatibility analysis is based on general best practices and may vary by employer</li>
                                    <li>Users are responsible for fact-checking and personalizing all generated content</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Privacy and Data Protection</h2>
                                <p>
                                    Your privacy is important to us. Please review our <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>, which also governs your use of the service, to understand our practices.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Intellectual Property</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>CareerFlow AI and its technology are protected by intellectual property laws</li>
                                    <li>You may not copy, modify, or distribute our proprietary technology</li>
                                    <li>Templates and design elements remain our intellectual property</li>
                                    <li>Your personal content remains your intellectual property</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
                                <p>
                                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, CAREERFLOW AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Either party may terminate this agreement at any time</li>
                                    <li>Upon termination, your access to the service will cease</li>
                                    <li>We may retain your data as required by law or our data retention policy</li>
                                    <li>Paid subscriptions will continue until the end of the billing period</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
                                <p>
                                    We reserve the right to modify these terms at any time. We will notify users of material changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
                                <p>
                                    These terms shall be interpreted and governed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law provisions.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
                                <p>
                                    If you have any questions about these Terms of Service, please contact us:
                                </p>
                                <ul className="list-none space-y-1">
                                    <li>Email: legal@careerflow.ai</li>
                                    <li>Address: [Your Business Address]</li>
                                </ul>
                            </section>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TermsOfServicePage;