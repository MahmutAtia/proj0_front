'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
// import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useState, useEffect } from 'react';

export default function TestPage() {
    const [chartData, setChartData] = useState({});
    const [products] = useState([
        { id: 1, name: 'Product A', price: 100, status: 'In Stock' },
        { id: 2, name: 'Product B', price: 200, status: 'Low Stock' },
        { id: 3, name: 'Product C', price: 300, status: 'Out of Stock' }
    ]);

    useEffect(() => {
        setChartData({
            labels: ['January', 'February', 'March'],
            datasets: [
                {
                    label: 'Sales',
                    data: [65, 59, 80],
                    fill: false,
                    borderColor: '#4B0082',
                    tension: 0.4
                }
            ]
        });
    }, []);

    return (
        <div className="min-h-screen">
            <div className="grid">
                {/* Header Section */}
                <div className="col-12 mb-4">
                    <Card className="shadow-4 transform transition-all hover:scale-[1.01]">
                        <h1 className="text-4xl font-bold text-primary mb-4">Dashboard Overview</h1>
                        <p className="text-lg text-700">Welcome to your awesome test component!</p>
                    </Card>
                </div>

                {/* Stats Cards */}
                <div className="col-12 md:col-6 lg:col-3 mb-4">
                    <Card className="bg-blue-50 shadow-4 transform transition-all hover:scale-[1.02]">
                        <div className="flex align-items-center">
                            <i className="pi pi-shopping-cart text-4xl text-blue-500 mr-3"></i>
                            <div>
                                <span className="block text-900 font-medium mb-1">Orders</span>
                                <span className="text-2xl font-bold">152</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Chart Section */}
                <div className="col-12 md:col-6 mb-4">
                    <Card className="shadow-4">
                        <h3 className="text-xl font-semibold mb-3">Sales Overview</h3>
                        {/* {chartData.datasets && <Chart type="line" data={chartData} />} */}
                    </Card>
                </div>

                {/* Table Section */}
                <div className="col-12 mb-4">
                    <Card className="shadow-4">
                        <DataTable
                            value={products}
                            paginator
                            rows={5}
                            className="p-datatable-gridlines"
                            showGridlines
                            stripedRows
                        >
                            <Column field="id" header="ID" sortable></Column>
                            <Column field="name" header="Name" sortable></Column>
                            <Column field="price" header="Price" sortable body={(rowData) => `$${rowData.price}`}></Column>
                            <Column field="status" header="Status" sortable></Column>
                        </DataTable>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="col-12 flex gap-3 justify-content-center">
                    <Button label="Add New" icon="pi pi-plus" className="p-button-raised p-button-success" />
                    <Button label="Export" icon="pi pi-download" className="p-button-raised p-button-info" />
                    <Button label="Delete" icon="pi pi-trash" className="p-button-raised p-button-danger" />
                </div>
            </div>
        </div>
    );
}
