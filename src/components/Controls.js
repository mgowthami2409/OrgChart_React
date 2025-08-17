
import React from "react";
function Controls({ searchQuery, setSearchQuery, onRefresh, onBack, onPrint }) {
   return (
      <div className="top-bar">    {/* was controls */}
         <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Name..."
         />
         <button className="refresh" onClick={onRefresh}>Refresh</button>
         <button className="back" onClick={onBack}>Back</button>
         <button className="print" onClick={onPrint}>Print</button>
      </div>
   );
}
export default Controls;