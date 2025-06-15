'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const PaymentHistoryPage = () => {
    const { data: session } = useSession();
    const toast = useRef(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.accessToken) {
            fetchPaymentHistory();
        } else {
            setLoading(false);
        }
    }, [session]);

    const fetchPaymentHistory = async () => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans/payments/`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            setPayments(response.data);
        } catch (error) {
            console.error('Error fetching payment history:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load payment history'
            });
        } finally {
            setLoading(false);
        }
    };

    const statusBodyTemplate = (rowData) => {
        const severityMap = {
            'confirmed': 'success',
            'waiting': 'warning',
            'rejected': 'danger',
            'error': 'danger'
        };

        return <Badge value={rowData.status.toUpperCase()} severity={severityMap[rowData.status] || 'info'} />;
    };

    const amountBodyTemplate = (rowData) => {
        return `$${rowData.total} ${rowData.currency}`;
    };

    const dateBodyTemplate = (rowData) => {
        return new Date(rowData.created).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="flex justify-content-center align-items-center min-h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    if (!session?.accessToken) {
        return (
            <div className="container mx-auto p-4">
                <Card className="text-center">
                    <h2>Login Required</h2>
                    <p>Please log in to view your payment history.</p>
                    <Button label="Go to Login" onClick={() => window.location.href = '/login'} />
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-6">
                <h1 className="text-3xl font-bold">Payment History</h1>
                <Button
                    label="Back to Plans"
                    outlined
                    onClick={() => window.location.href = '/plans'}
                />
            </div>

            <Card>
                {payments.length > 0 ? (
                    <DataTable value={payments} paginator rows={10} responsiveLayout="scroll">
                        <Column field="id" header="Payment ID" />
                        <Column field="created" header="Date" body={dateBodyTemplate} />
                        <Column field="total" header="Amount" body={amountBodyTemplate} />
                        <Column field="variant" header="Method" />
                        <Column field="status" header="Status" body={statusBodyTemplate} />
                    </DataTable>
                ) : (
                    <div className="text-center">
                        <h3>No Payment History</h3>
                        <p>You haven&apos;t made any payments yet.</p>
                        <Button label="View Plans" onClick={() => window.location.href = '/plans'} />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentHistoryPage;
