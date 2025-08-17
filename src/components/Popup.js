import React from "react";
function Popup({ employee, data, onClose }) {
   const manager = data.find(r => String(r.ID) === String(employee["Parent ID"]));
   return (
      <div className="popup" onClick={onClose}>
         <div className="popup-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={onClose}>&times;</span>
            {employee.Photo && (
               <img src={employee.Photo} alt={employee.First_Name} className="emp-photo" />
            )}
            <div className="popup-field"><strong>ID:</strong> {employee.ID}</div>
            <div className="popup-field"><strong>Name:</strong> {employee.First_Name}</div>
            <div className="popup-field"><strong>Designation:</strong> {employee.Designation}</div>
            <div className="popup-field"><strong>Manager:</strong> {manager ? manager.First_Name : "None"}</div>
            <div className="popup-field"><strong>Department:</strong> {employee.Department || ""}</div>
         </div>
      </div>
   );
}
export default Popup;
