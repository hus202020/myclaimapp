import React from 'react';
import { Routes, Route, Link } from "react-router-dom";
import ClaimForm from './components/ClaimForm';
import PDFEditor from './components/PDFEditor';
import ManageCategories from './components/ManageCategories';
import ManagePayees from './components/ManagePayees';
import ManageClaims from './components/ManageClaims';
import './App.css';

function App() {
  return (
    <div className="App">
      <nav className="sidebar">
        <ul>
          <li><Link to="/">Claim Form</Link></li>
          <li><Link to="/pdf-editor">PDF Template Editor</Link></li>
          <li><Link to="/manage-categories">Manage Categories</Link></li>
          <li><Link to="/manage-payees">Manage Payees</Link></li>
          <li><Link to="/manage-claims">Manage Claims</Link></li>
        </ul>
      </nav>
      <div className="content">
        <Routes>
          <Route path="/" element={<ClaimForm />} />
          <Route path="/pdf-editor" element={<PDFEditor />} />
          <Route path="/manage-categories" element={<ManageCategories />} />
          <Route path="/manage-payees" element={<ManagePayees />} />
          <Route path="/manage-claims" element={<ManageClaims />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;