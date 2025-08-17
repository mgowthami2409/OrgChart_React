import React, { useState } from "react";
import FileUploader from "./components/FileUploader";
import OrgChartView from "./components/OrgChartView";
import Popup from "./components/Popup";
import "./index.css";
function App() {
   const [originalData, setOriginalData] = useState([]);
   const [displayData, setDisplayData] = useState([]);
   const [selectedEmployee, setSelectedEmployee] = useState(null);
   const handleBackToUpload = () => {
      setDisplayData([]);    // ✅ clears chart data
      setOriginalData([]);   // optional, clears uploaded dataset
      setSelectedEmployee(null);
   };
   return (
      <div className="App">
         {displayData.length === 0 ? (
            <FileUploader
               setOriginalData={setOriginalData}
               setDisplayData={setDisplayData}
            />
         ) : (
            <OrgChartView
               data={displayData}
               originalData={originalData}
               setDisplayData={setDisplayData}
               setSelectedEmployee={setSelectedEmployee}
               onBackToUpload={handleBackToUpload}    // ✅ Back button works
            />
         )}
         {selectedEmployee && (
            <Popup
               employee={selectedEmployee}
               data={displayData}
               onClose={() => setSelectedEmployee(null)}
            />
         )}
      </div>
   );
}
export default App;