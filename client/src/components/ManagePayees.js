import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagePayees = () => {
  const [query, setQuery] = useState('');
  const [payees, setPayees] = useState([]);

  const fetchPayees = () => {
    axios.get(`http://localhost:5000/api/payees?q=${query}`)
      .then(response => setPayees(response.data.payees))
      .catch(error => console.error("Error fetching payees", error));
  };

  useEffect(() => {
    fetchPayees();
  }, [query]);

  return (
    <div>
      <h2>Manage Payees</h2>
      <input 
        type="text" 
        placeholder="Search payees" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {payees.map(payee => (
          <li key={payee.id}>
            {payee.name} - {payee.account_number}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManagePayees;