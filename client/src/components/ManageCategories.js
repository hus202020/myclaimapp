import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [claimCode, setClaimCode] = useState('');

  const fetchCategories = () => {
    axios.get('http://localhost:5000/api/categories')
      .then(response => setCategories(response.data.categories))
      .catch(error => console.error("Error fetching categories", error));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    if (!name || !claimCode) return;
    axios.post('http://localhost:5000/api/categories', { name, claim_code: parseInt(claimCode, 10) })
      .then(response => {
        setName('');
        setClaimCode('');
        fetchCategories();
      })
      .catch(error => console.error("Error adding category", error));
  };

  const handleDelete = (id) => {
    axios.delete(`http://localhost:5000/api/categories/${id}`)
      .then(response => fetchCategories())
      .catch(error => console.error("Error deleting category", error));
  };

  return (
    <div>
      <h2>Manage Claim Categories</h2>
      <div>
        <input 
          type="text" 
          placeholder="Category Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} />
        <input 
          type="number" 
          placeholder="Claim Code" 
          value={claimCode} 
          onChange={(e) => setClaimCode(e.target.value)} />
        <button onClick={handleAdd}>Add Category</button>
      </div>
      <ul>
        {categories.map(cat => (
          <li key={cat.id}>
            {cat.name} (Code: {cat.claim_code})
            <button onClick={() => handleDelete(cat.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageCategories;