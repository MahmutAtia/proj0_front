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
import { useRouter } from 'next/navigation';
import axios from 'axios';

const PaymentHistoryPage = () => {
    const { data: session } = useSession();
    const router = useRouter();
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
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/`, {
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
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
            </div>
        );
    }

    if (!session?.accessToken) {
        return (
            <div className="card">
                <div className="text-center">
                    <h2>Login Required</h2>
                    <p>Please log in to view your payment history.</p>
                    <Button label="Go to Login" onClick={() => router.push('/login')} />
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />

            <div className="flex justify-content-between align-items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-900 mb-2">Payment History</h1>
                    <p className="text-600">View all your subscription payments</p>
                </div>
                <Button
                    label="Back to Plans"
                    icon="pi pi-arrow-left"
                    outlined
                    onClick={() => router.push('/main/plans')}
                />
            </div>

            <Card>
                {payments.length > 0 ? (
                    <DataTable
                        value={payments}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        stripedRows
                    >
                        <Column field="id" header="Payment ID" />
                        <Column field="created" header="Date" body={dateBodyTemplate} />
                        <Column field="total" header="Amount" body={amountBodyTemplate} />
                        <Column field="variant" header="Method" />
                        <Column field="status" header="Status" body={statusBodyTemplate} />
                    </DataTable>
                ) : (
                    <div className="text-center py-6">
                        <i className="pi pi-credit-card text-6xl text-400 mb-4"></i>
                        <h3>No Payment History</h3>
                        <p className="text-600 mb-4">You haven&apos;t made any payments yet.</p>
                        <Button label="View Plans" onClick={() => router.push('/main/plans')} />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default PaymentHistoryPage;
