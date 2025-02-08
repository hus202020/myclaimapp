import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const ManageClaims = () => {
  const [claims, setClaims] = useState([]);

  const fetchClaims = () => {
    axios.get('http://localhost:5000/api/claims')
      .then(response => setClaims(response.data.claims))
      .catch(error => console.error("Error fetching claims", error));
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const regeneratePDF = (claim) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Claim Form", 20, 20);
    doc.setFontSize(12);
    doc.text(`Claim Date: ${claim.claim_date}`, 20, 40);
    doc.text(`Claim Number: ${claim.claim_number}`, 20, 50);
    doc.text(`Claim Category: ${claim.category_name}`, 20, 60);
    doc.text(`Claim Code: ${claim.claim_code}`, 20, 70);
    doc.text(`Payee Name: ${claim.payee_name}`, 20, 80);
    doc.text(`Payee Account Number: ${claim.payee_account}`, 20, 90);
    doc.text(`Payment Amount: RM ${claim.payment_amount}`, 20, 100);

    doc.save(`Claim_${claim.claim_number}.pdf`);
  };

  return (
    <div>
      <h2>Manage Claims</h2>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Claim Number</th>
            <th>Date</th>
            <th>Category</th>
            <th>Claim Code</th>
            <th>Payee</th>
            <th>Amount (RM)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.map(claim => (
            <tr key={claim.id}>
              <td>{claim.claim_number}</td>
              <td>{claim.claim_date}</td>
              <td>{claim.category_name}</td>
              <td>{claim.claim_code}</td>
              <td>{claim.payee_name}</td>
              <td>{claim.payment_amount}</td>
              <td>
                <button onClick={() => regeneratePDF(claim)}>Regenerate PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageClaims;