import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";

function FileUploader({ setOriginalData, setDisplayData }) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false); // ✅ track submit state

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setFileName("");
      setError("");
      return;
    }

    const validExtensions = [".xlsx", ".xls"];
    const isValid = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      setFileName("");
      setError("Error: Please choose the correct format (.xlsx or .xls)");
      return;
    }

    setFileName(file.name);
    setError("");
  };

  const handleSubmit = () => {
    const file =
      fileInputRef.current?.files?.length > 0
        ? fileInputRef.current.files[0]
        : null;

    if (!file) {
      setError("Error: Please choose a valid file first.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      setOriginalData(jsonData);
      setDisplayData(jsonData);
      setError("");
      setSubmitted(true); // ✅ switch to new UI
    };
    reader.readAsArrayBuffer(file);
  };

  const handleClear = () => {
    setFileName("");
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRefresh = () => {
    window.location.reload(); // refresh the page
  };

  const handleBack = () => {
    setSubmitted(false);  // back to upload screen
    handleClear();
  };

  // ✅ If submitted, show different UI
  if (submitted) {
    return (
      <div className="app-container">
        <header className="header">
          <img src="/onlylogo.png" alt="Logo" className="logo" />
          <h1>SUPRAJIT ENGINEERING LIMITED</h1>
        </header>

        <h2 className="sub-header">ORGANIZATION CHART</h2>

        {/* Organization chart or processed content goes here */}
        <div className="chart-container">
          <p>✅ Data uploaded successfully. Organization chart displayed here.</p>
        </div>

        <div className="action-buttons">
          <button onClick={handleRefresh}>Refresh</button>
          <button onClick={() => window.print()}>Print</button>
          <button onClick={handleBack}>Back</button>
        </div>
      </div>
    );
  }

  // ✅ Default upload UI
  return (
    <div className="app-container">
      <header className="header">
        <img src="/onlylogo.png" alt="Logo" className="logo" />
        <h1>SUPRAJIT ENGINEERING LIMITED</h1>
      </header>

      <h2 className="sub-header">ORGANIZATION CHART</h2>

      <div className="template-download">
        <p>Download the <b>.xlsx</b> file template:</p>
        <a href="/template.xlsx" download className="download-btn">
          📥 Excel Template
        </a>
      </div>

      <div className="upload-section">
        <button onClick={handleChooseFile}>Choose File</button>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={handleClear}>Clear</button>
        <br />
        <span className={`file-name ${error ? "error" : fileName ? "success" : ""}`}>
          {error ? error : (fileName ? fileName : "No file chosen")}
        </span>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default FileUploader;
