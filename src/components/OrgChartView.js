import React, { useEffect, useRef, useState } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import Controls from "./Controls";
import "./OrgChartView.css";
function OrgChartView({ data, originalData, setDisplayData, setSelectedEmployee, onBackToUpload }) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  useEffect(() => {
    if (!data || data.length === 0 || !chartContainerRef.current) return;
    const nodes = data.map(row => ({
      id: row.ID,
      pid: row["Parent ID"] || null,
      name: row.First_Name,
      title: row.Designation,
      img: row.Photo
    }));
    const chart = new OrgChart(chartContainerRef.current, {
      nodes,
      nodeBinding: {
        field_0: "name",
        field_1: "title",
        img_0: "img"
      },
      scaleInitial: OrgChart.match.boundary,
      template: "ana",
      layout: OrgChart.mixed,
      enableSearch: false,
      spacing: 100,
      levelSeparation: 100,
      nodeMenu: null,
      editForm: null,
      collapse: { level: 9999 }
    });
    chart.on("click", (sender, args) => {
      const emp = data.find(r => r.ID.toString() === args.node.id.toString());
      if (emp) setSelectedEmployee(emp);
    });
    chartInstanceRef.current = chart;
    return () => chart.destroy();
  }, [data, setSelectedEmployee]);
  const handleRefresh = () => {
    setDisplayData(originalData);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.load(originalData.map(row => ({
        id: row.ID,
        pid: row["Parent ID"] || null,
        name: row.First_Name,
        title: row.Designation,
        img: row.Photo
      })));
      chartInstanceRef.current.fit();
    }
    setSearchQuery("");
  };
  const handleBack = () => {
    if (onBackToUpload) onBackToUpload();
  };
  const handlePrint = () => window.print();
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      // reload full chart
      chartInstanceRef.current.load(originalData.map(row => ({
        id: row.ID,
        pid: row["Parent ID"] || null,
        name: row.First_Name,
        title: row.Designation,
        img: row.Photo
      })));
      chartInstanceRef.current.fit();
      return;
    }
    // find first partial match
    const root = originalData.find(emp =>
      emp.First_Name.toLowerCase().includes(query.toLowerCase())
    );
    if (!root) return;
    // collect subtree recursively
    const collectSubtree = (id) => {
      const children = originalData.filter(e => e["Parent ID"] === id);
      return [
        ...children,
        ...children.flatMap(child => collectSubtree(child.ID))
      ];
    };
    const subtreeNodes = [root, ...collectSubtree(root.ID)];
    chartInstanceRef.current.load(subtreeNodes.map(row => ({
      id: row.ID,
      pid: row["Parent ID"] || null,
      name: row.First_Name,
      title: row.Designation,
      img: row.Photo
    })));
    chartInstanceRef.current.fit();
  };
  return (
    <>
      <div className="print-header" style={{ display: "none" }}>
        <img src="/onlylogo.png" alt="Logo" />
        <h1>Suprajit</h1>
      </div>
      <div className="orgchart-view">
        <header className="header">SUPRAJIT ENGINEERING LIMITED</header>
        <Controls
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}   // custom search handler
          onRefresh={handleRefresh}
          onBack={handleBack}
          onPrint={handlePrint}
        />
        <div className="orgchart-container">
          <div className="chart-container" id="orgChart" ref={chartContainerRef}></div>
        </div>
      </div>
    </>
  );
}
export default OrgChartView;