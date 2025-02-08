import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';

const ClaimForm = () => {
  const [claimDate, setClaimDate] = useState(() => new Date().toISOString().substr(0, 10));
  const [claimNumber, setClaimNumber] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [claimCode, setClaimCode] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [payeeAccount, setPayeeAccount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [payeeSuggestions, setPayeeSuggestions] = useState([]);

  // Fetch next claim number when component mounts
  useEffect(() => {
    axios.get('http://localhost:5000/api/claim/next-number')
      .then(response => {
        setClaimNumber(response.data.nextNumber);
      })
      .catch(error => {
        console.error("Error fetching claim number", error);
      });
  }, []);

  // Fetch claim categories
  useEffect(() => {
    axios.get('http://localhost:5000/api/categories')
      .then(response => {
        setCategories(response.data.categories);
      })
      .catch(error => {
        console.error("Error fetching categories", error);
      });
  }, []);

  // Update claim code when category changes
  useEffect(() => {
    const cat = categories.find(c => c.id === parseInt(selectedCategory));
    if (cat) {
      setClaimCode(cat.claim_code);
    } else {
      setClaimCode('');
    }
  }, [selectedCategory, categories]);

  // Fetch payee suggestions when payeeName changes
  useEffect(() => {
    if (payeeName.length > 1) {
      axios.get(`http://localhost:5000/api/payees?q=${payeeName}`)
        .then(response => {
          setPayeeSuggestions(response.data.payees);
        })
        .catch(error => {
          console.error("Error fetching payees", error);
        });
    } else {
      setPayeeSuggestions([]);
    }
  }, [payeeName]);

  const handleGeneratePDF = () => {
    // Generate PDF using jsPDF
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Claim Form", 20, 20);
    doc.setFontSize(12);
    doc.text(`Claim Date: ${claimDate}`, 20, 40);
    doc.text(`Claim Number: ${claimNumber}`, 20, 50);
    const catName = categories.find(c => c.id === parseInt(selectedCategory))?.name || '';
    doc.text(`Claim Category: ${catName}`, 20, 60);
    doc.text(`Claim Code: ${claimCode}`, 20, 70);
    doc.text(`Payee Name: ${payeeName}`, 20, 80);
    doc.text(`Payee Account Number: ${payeeAccount}`, 20, 90);
    doc.text(`Payment Amount: RM ${paymentAmount}`, 20, 100);

    // Save the PDF
    doc.save(`Claim_${claimNumber}.pdf`);

    // Optionally, send data to the server to store the claim record
    axios.post('http://localhost:5000/api/claims', {
      claim_date: claimDate,
      category_id: selectedCategory,
      payee_name: payeeName,
      payment_amount: paymentAmount
    }).then(response => {
      alert("Claim saved with number " + response.data.claim_number);
      // Refresh the next claim number
      axios.get('http://localhost:5000/api/claim/next-number')
        .then(res => setClaimNumber(res.data.nextNumber));
    }).catch(error => {
      console.error("Error saving claim", error);
    });
  };

  const handlePayeeSelect = (payee) => {
    setPayeeName(payee.name);
    setPayeeAccount(payee.account_number || '');
    setPayeeSuggestions([]);
  };

  return (
    <div>
      <h2>Claim Form</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleGeneratePDF(); }}>
        <div>
          <label>Claim Date:</label>
          <input type="date" value={claimDate} onChange={(e) => setClaimDate(e.target.value)} />
        </div>
        <div>
          <label>Claim Number:</label>
          <input type="text" value={claimNumber} readOnly />
        </div>
        <div>
          <label>Claim Category:</label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Claim Code:</label>
          <input type="text" value={claimCode} readOnly />
        </div>
        <div>
          <label>Payee Name:</label>
          <input type="text" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} autoComplete="off" />
          {payeeSuggestions.length > 0 && (
            <ul style={{ border: '1px solid #ccc', listStyle: 'none', padding: 0 }}>
              {payeeSuggestions.map(payee => (
                <li key={payee.id} onClick={() => handlePayeeSelect(payee)} style={{ cursor: 'pointer' }}>
                  {payee.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label>Payee Account Number:</label>
          <input type="text" value={payeeAccount} onChange={(e) => setPayeeAccount(e.target.value)} />
        </div>
        <div>
          <label>Payment Amount (RM):</label>
          <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
        </div>
        <button type="submit">Generate PDF</button>
      </form>
    </div>
  );
};

export default ClaimForm;