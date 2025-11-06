import React, { useEffect, useRef, useState, useMemo } from "react";
import { OrgChart } from "d3-org-chart";
import html2canvas from "html2canvas";
import Controls from "./Controls";
import InstructionsPopup from "./InstructionsPopup";
import "./OrgChartView.css";

function OrgChartView_d3({
  data,
  originalData,
  setDisplayData,
  setSelectedEmployee,
  onBackToUpload,
  headers = [],
  department = "",
}) {
  const chartContainerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [layout, setLayout] = useState("vertical");
  const [template, setTemplate] = useState("classic"); // 👈 template selector
  const [showInstructions, setShowInstructions] = useState(false);
  const chartRef = useRef(null);

  const getColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("active")) return "#1e4489";
    if (s.includes("notice")) return "#bd2331";
    if (s.includes("vacant")) return "#ef6724";
    return "#777";
  };

  // --- Define template styles ---
        const templates = useMemo(() => ({
        classic: (d) => `
            <div style="border-radius:10px;border:2px solid ${getColor(
            d.data.status
            )};background:${getColor(
            d.data.status
        )};color:white;width:260px;height:150px;
            display:flex;flex-direction:column;
            align-items:center;justify-content:center;">
            <img src="${d.data.photo || ""}" 
                style="width:60px;height:60px;border-radius:50%;border:2px solid #fff;margin-bottom:8px;" />
            <div style="font-size:16px;font-weight:bold;">${d.data.name}</div>
            <div style="font-size:14px;">${d.data.title}</div>
            </div>`,

        minimal: (d) => `
            <div style="border:1px solid #aaa;border-radius:8px;
                        background:white;color:#333;
                        width:220px;height:100px;padding:8px;
                        display:flex;flex-direction:column;
                        justify-content:center;align-items:center;
                        box-shadow:0 2px 5px rgba(0,0,0,0.2);">
            <div style="font-weight:bold;font-size:15px;color:#1e4489;">${d.data.name}</div>
            <div style="font-size:13px;color:#666;">${d.data.title}</div>
            </div>`,

        photoCard: (d) => `
            <div style="border:2px solid ${getColor(d.data.status)};
                        border-radius:8px;background:white;
                        display:flex;width:280px;height:100px;
                        overflow:hidden;box-shadow:0 3px 6px rgba(0,0,0,0.25);">
            <img src="${d.data.photo || ""}" 
                style="width:100px;height:100px;object-fit:cover;" />
            <div style="padding:8px;text-align:left;">
                <div style="font-weight:bold;font-size:16px;color:#1e4489;">${d.data.name}</div>
                <div style="font-size:13px;color:#333;">${d.data.title}</div>
                <div style="font-size:12px;color:${getColor(d.data.status)};">${d.data.status}</div>
            </div>
            </div>`,
        }), []);;

  useEffect(() => {
    if (!data || data.length === 0) return;

    const chartData = data.map((r) => ({
      id: r.ID,
      parentId: r["Parent ID"] || null,
      name: r.First_Name || "",
      title: r.Designation || "",
      photo: r.Photo || "",
      status: r.Status || "",
    }));

    const chart = new OrgChart()
      .container(chartContainerRef.current)
      .data(chartData)
      .nodeWidth(() => 280)
      .nodeHeight(() => 160)
      .childrenMargin(() => 60)
      .compact(false)
      .nodeContent(templates[template])
      .onNodeClick((d) => setSelectedEmployee(d.data))
      .render();

    chartRef.current = chart;
  }, [data, template]); // 👈 re-render on template change

  const handleExportImage = async () => {
    if (!chartContainerRef.current) return;
    const canvas = await html2canvas(chartContainerRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = imgData;
    link.download = "orgchart.png";
    link.click();
  };

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    if (chartRef.current) chartRef.current.layout(newLayout).render();
  };

  const handleRefresh = () => {
    if (chartRef.current) chartRef.current.render();
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!chartRef.current) return;

    if (!query) {
      chartRef.current.clearHighlight().render();
      return;
    }

    chartRef.current
      .setHighlighted((node) =>
        node.data.name?.toLowerCase().includes(query.toLowerCase())
      )
      .render();
  };

  const handlePrint = () => window.print();

  const toggleFullScreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) elem.requestFullscreen();
    else document.exitFullscreen();
  };

  return (
    <>
      <div className="orgchart-view">
        <header className="header">SUPRAJIT ENGINEERING LIMITED</header>
        <Controls
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}
          onRefresh={handleRefresh}
          onBack={onBackToUpload}
          onPrint={handlePrint}
          onExportImage={handleExportImage}
          toggleFullScreen={toggleFullScreen}
          onLayoutChange={handleLayoutChange}
          selectedLayout={layout}
        />

        {/* Template Selector */}
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "8px", fontWeight: "bold" }}>Template:</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{ padding: "6px", borderRadius: "6px" }}
          >
            <option value="classic">Classic</option>
            <option value="minimal">Minimal</option>
            <option value="photoCard">Photo Card</option>
          </select>
        </div>

        <div className="chart-container" ref={chartContainerRef}></div>
      </div>

      {/* Status Legend */}
      <div className="theme">
        <p className="themep">
          <span style={{ color: "#1e4489", fontWeight: "bold" }}>●</span> Active
        </p>
        <p className="themep">
          <span style={{ color: "#ef6724", fontWeight: "bold" }}>●</span> Vacant
        </p>
        <p className="themep">
          <span style={{ color: "#bd2331", fontWeight: "bold" }}>●</span> Notice
        </p>
      </div>

      {showInstructions && (
        <InstructionsPopup onClose={() => setShowInstructions(false)} />
      )}
    </>
  );
}

export default OrgChartView_d3;
