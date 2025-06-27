import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const BarChartComponent = ({ expenses }) => {
    // Prepare data for the chart, converting date to a readable format
    const data = expenses.map(expense => ({
        date: new Date(expense.date).toLocaleDateString(),  // Format date
        amount: expense.amount,
        name: expense.name,
        tripBudget: expense.tripBudget,
    }));

    // Calculate the total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2);

    // Check if dark mode is enabled
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    // Custom tooltip component with dynamic text color
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: isDarkMode ? '#333' : '#444',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    color: isDarkMode ? 'white' : 'black'
                }}>
                    <p><strong>Data:</strong> {label}</p>
                    <p><strong>Nazwa:</strong> {payload[0].payload.name}</p>
                    <p><strong>Kwota:</strong> {payload[0].value} zł</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            {/* Display total amount above the chart */}
            <div style={{ textAlign: 'center', marginBottom: '10px', color: isDarkMode ? 'white' : 'black' }}>
                <strong>Łączna kwota wydatków: {totalAmount} zł</strong>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#444' : '#ddd'} />
                    <XAxis dataKey="date" stroke={isDarkMode ? 'white' : 'black'} />
                    <YAxis stroke={isDarkMode ? 'white' : 'black'} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="amount" fill={isDarkMode ? "#4C9AFF" : "#085ED7"} name="Kwota" label={{ position: 'top', fill: isDarkMode ? 'white' : 'black' , formatter: (value) => `${value} zł`,}}  />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BarChartComponent;