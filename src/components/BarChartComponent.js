import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BarChartComponent = ({ expenses }) => {
    // Prepare data for the chart, converting date to a readable format
    const data = expenses.map(expense => ({
        date: new Date(expense.date).toLocaleDateString(),  // Format date
        amount: expense.amount,
        name: expense.name
    }));

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px'
                }}>
                    <p><strong>Data:</strong> {label}</p>
                    <p><strong>Nazwa:</strong> {payload[0].payload.name}</p>
                    <p><strong>Kwota:</strong> {payload[0].value}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default BarChartComponent;