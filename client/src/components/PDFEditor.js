import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PDFEditor = () => {
  const [template, setTemplate] = useState({});
  const [templateText, setTemplateText] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/pdf-template')
      .then(response => {
        setTemplate(response.data.template);
        setTemplateText(JSON.stringify(response.data.template, null, 2));
      })
      .catch(error => {
        console.error("Error fetching PDF template", error);
      });
  }, []);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(templateText);
      axios.post('http://localhost:5000/api/pdf-template', { template: parsed })
        .then(response => {
          alert("Template updated successfully.");
          setTemplate(parsed);
        })
        .catch(error => {
          console.error("Error saving template", error);
        });
    } catch (e) {
      alert("Invalid JSON format.");
    }
  };

  return (
    <div>
      <h2>PDF Template Editor</h2>
      <p>Edit the JSON configuration for the PDF template.</p>
      <textarea 
        rows="20" 
        cols="80" 
        value={templateText} 
        onChange={(e) => setTemplateText(e.target.value)}>
      </textarea>
      <br />
      <button onClick={handleSave}>Save Template</button>
    </div>
  );
};

export default PDFEditor;