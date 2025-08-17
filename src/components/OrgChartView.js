import React, { useEffect, useRef, useState } from "react";
import OrgChart from "@balkangraph/orgchart.js";
import Controls from "./Controls";
import "./OrgChartView.css";
function OrgChartView({ data, originalData, setDisplayData, setSelectedEmployee, onBackToUpload, headers = [], selectedFields = { nameField: 'First_Name', titleField: 'Designation' }, setSelectedFields, department = '' }) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Template selection state: keep only the requested templates
  const templates = [
    { key: 'ana', label: 'Ana' },
    { key: 'olivia', label: 'Olivia' },
    { key: 'belinda', label: 'Belinda' },
    { key: 'rony', label: 'Rony' },
    { key: 'mery', label: 'Mery' },
    { key: 'polina', label: 'Polina' },
    { key: 'diva', label: 'Diva' },
    { key: 'isla', label: 'Isla' }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0].key);
  // local fallback for selected fields if parent doesn't provide setter
  const [localSelected, setLocalSelected] = useState({ nameField: 'First_Name', titleField: 'Designation' });
  const [localDepartment, setLocalDepartment] = useState(department || '');
  const effectiveSelected = (selectedFields && setSelectedFields) ? selectedFields : localSelected;
  // Helper: color nodes based on Status column values
  const colorNodes = (chartObj, rows) => {
    if (!chartObj || !rows || !Array.isArray(rows)) return;
    const getColorForStatus = (status) => {
      if (!status) return null;
      const s = String(status).toLowerCase();
      if (s.includes("active")) return "#2ecc71"; // green
      if (s.includes("notice")) return "#f1c40f"; // yellow
      if (s.includes("vacant") || s.includes("vacency")) return "#e74c3c"; // red
      return null; // leave default
    };
    try {
      for (const r of rows) {
        const id = (r.ID == null) ? null : String(r.ID);
        const color = getColorForStatus(r.Status || r.status);
        if (!color) continue;
        // get element by API first, fall back to searching DOM by data-id
        let el = null;
        if (id && typeof chartObj.getNodeElement === "function") el = chartObj.getNodeElement(id);
        if (!el && chartObj && chartObj.element) {
          // attempt to find node wrapper by common attributes used by the lib
          el = chartObj.element.querySelector(`[data-id="${id}"]`) || chartObj.element.querySelector(`#${id}`) || chartObj.element.querySelector(`[data-node-id="${id}"]`) || chartObj.element.querySelector(`[data-n-id="${id}"]`);
        }
        if (!el) continue;
        // Try several selectors used by templates to apply visible color
        const candidates = [];
        try { candidates.push(el.querySelector && (el.querySelector('.boc-node') || el.querySelector('.boc-node-content') || el.querySelector('.boc-node-inner'))); } catch(e){ }
        try { candidates.push(el.querySelector && el.querySelector('.node')); } catch(e){}
        try { candidates.push(el.querySelector && el.querySelector('.chart-node')); } catch(e){}
        // include the element itself last
        candidates.push(el);
        for (const target of candidates) {
          if (!target || !target.style) continue;
          // primary background
          target.style.setProperty('background-color', color, 'important');
          target.style.backgroundColor = color;
          // for svg rects inside node templates, set fill
          const rects = target.querySelectorAll ? target.querySelectorAll('rect') : [];
          for (const rct of rects) {
            try { rct.setAttribute('fill', color); } catch(e) {}
          }
          // for elements that use box-shadow or pseudo elements, also set borderColor where applicable
          try { target.style.borderColor = color; } catch(e) {}
        }
      }
    } catch (e) {
      // non-fatal
    }
  };

  // Helper: inject a small status badge into each node (top-right)
  const addStatusBadges = (chartObj, rows) => {
    if (!chartObj || !chartObj.element || !rows || !Array.isArray(rows)) return;
    const getColorForStatus = (status) => {
      if (!status) return null;
      const s = String(status).toLowerCase();
      if (s.includes("active")) return "#2ecc71"; // green
      if (s.includes("notice")) return "#f1c40f"; // yellow
      if (s.includes("vacant") || s.includes("vacency")) return "#e74c3c"; // red
      return null;
    };
    try {
      for (const r of rows) {
        const id = (r.ID == null) ? null : String(r.ID);
        const color = getColorForStatus(r.Status || r.status);
        if (!id) continue;
        // find node element
        let el = null;
        if (typeof chartObj.getNodeElement === 'function') el = chartObj.getNodeElement(id);
        if (!el && chartObj.element) el = chartObj.element.querySelector(`[data-n-id="${id}"]`) || chartObj.element.querySelector(`[data-id="${id}"]`) || chartObj.element.querySelector(`#${id}`) || chartObj.element.querySelector(`[data-node-id="${id}"]`);
        if (!el) continue;
        // find or create badge
        let badge = el.querySelector('.status-badge');
        if (!badge) {
          badge = document.createElement('div');
          badge.className = 'status-badge';
          // insert at end of node wrapper so absolute positioning works
          el.appendChild(badge);
        }
        // set color or hide
        if (color) {
          badge.style.backgroundColor = color;
          badge.style.display = 'block';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {
      // ignore
    }
  };
  useEffect(() => {
    // derive department from uploaded data if not explicitly provided
    if (!department) {
      try {
        const possibleKeys = ['Department', 'department', 'Dept', 'dept', 'Department Name', 'DepartmentName'];
        let found = '';
        if (Array.isArray(originalData) && originalData.length > 0) {
          // try headers first
          const headerKey = (headers || []).find(h => possibleKeys.includes(h));
          if (headerKey) {
            // take the most common non-empty value
            const counts = {};
            for (const r of originalData) {
              const v = (r[headerKey] || '').toString().trim();
              if (!v) continue;
              counts[v] = (counts[v] || 0) + 1;
            }
            const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
            if (entries.length) found = entries[0][0];
          } else {
            // fallback: scan rows for any of the possible keys
            for (const key of possibleKeys) {
              const v = originalData[0][key] || '';
              if (v && v.toString().trim()) { found = v.toString().trim(); break; }
            }
          }
        }
        if (found) setLocalDepartment(found);
      } catch(e) {}
    } else {
      setLocalDepartment(department);
    }

    if (!data || data.length === 0 || !chartContainerRef.current) return;
    const nodes = data.map(row => ({
      id: row.ID,
      pid: row["Parent ID"] || null,
      name: row[effectiveSelected.nameField] || '',
      title: row[effectiveSelected.titleField] || '',
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
  template: selectedTemplate,
  layout: OrgChart.mixed,
  // Disable the library's built-in details/edit UI on node click so
  // we don't get the right-side details panel. We use our own
  // click handler (chart.on("click", ...)) to show the popup.
  nodeMouseClick: OrgChart.none,
  nodeMouseDbClick: OrgChart.none,
      enableSearch: false,
      spacing: 100,
      levelSeparation: 100,
  nodeMenu: null,
  // provide a safe, read-only editForm object so the library
  // doesn't try to access properties on `null` and crash.
  editForm: { readOnly: true },
      collapse: { level: 9999 }
    });
    // Defensive: some versions of @balkangraph/orgchart.js try to open
    // an edit UI when a node is clicked and assume editUI.content is an
    // element (not null). In some runtime situations that value is null
    // which causes "Cannot read properties of null (reading 'readOnly')".
    // Patch the instance with a safe stub so the library's edit UI calls
    // won't crash the app. This keeps the chart read-only in our UI.
    try {
      if (!chart.editUI) chart.editUI = {};
      // ensure content is an object (not null) so property reads are safe
      if (chart.editUI.content == null) chart.editUI.content = {};
      // ensure show/hide are callable
      if (typeof chart.editUI.show !== "function") chart.editUI.show = () => {};
      if (typeof chart.editUI.hide !== "function") chart.editUI.hide = () => {};
    } catch (e) {
      // swallowing intentionally - this is a defensive runtime patch
      // if it fails, the original error will still surface and should be
      // investigated separately.
    }
    chart.on("click", (sender, args) => {
      const emp = data.find(r => r.ID.toString() === args.node.id.toString());
      if (emp) setSelectedEmployee(emp);
    });
    // reapply colors after any internal redraw
    if (typeof chart.on === 'function') {
      chart.on('redraw', () => {
        try {
          // chart.config.nodes contains the currently rendered nodes (id, pid, ...)
          const visibleIds = Array.isArray(chart.config && chart.config.nodes) ? chart.config.nodes.map(n => String(n.id)) : [];
          const rowsToColor = (originalData || []).filter(r => visibleIds.includes(String(r.ID)));
          colorNodes(chart, rowsToColor);
          addStatusBadges(chart, rowsToColor);
        } catch (e) {
          // ignore
        }
      });
    }
  // colorNodes helper is defined at component scope; call it after creation

  chartInstanceRef.current = chart;
  // color initial nodes (delay to allow internal rendering)
  setTimeout(() => { colorNodes(chart, data); addStatusBadges(chart, data); }, 300);
    return () => chart.destroy();
  }, [data, originalData, setSelectedEmployee, selectedTemplate, effectiveSelected.nameField, effectiveSelected.titleField, department, headers]);
  // note: selectedTemplate is included in the effect deps so changing it will recreate the chart
  const handleRefresh = () => {
    setDisplayData(originalData);
    if (chartInstanceRef.current) {
      chartInstanceRef.current.load(originalData.map(row => ({
        id: row.ID,
        pid: row["Parent ID"] || null,
        name: row.First_Name,
        title: row.Designation,
        img: row.Photo
      })), () => {
        colorNodes(chartInstanceRef.current, originalData);
    addStatusBadges(chartInstanceRef.current, originalData);
    chartInstanceRef.current.fit();
      });
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
    })), () => {
  colorNodes(chartInstanceRef.current, subtreeNodes);
  addStatusBadges(chartInstanceRef.current, subtreeNodes);
  chartInstanceRef.current.fit();
    });
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
          templates={templates}
          onSelectTemplate={setSelectedTemplate}
          selectedTemplate={selectedTemplate}
        />
        <div className="orgchart-container">
          <div className="field-selectors" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 8px' }}>
            <label>Show Name from:</label>
            <select value={effectiveSelected.nameField} onChange={e => (setSelectedFields ? setSelectedFields({ ...effectiveSelected, nameField: e.target.value }) : setLocalSelected({ ...effectiveSelected, nameField: e.target.value }))}>
              {(headers || []).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <label>Show Title from:</label>
            <select value={effectiveSelected.titleField} onChange={e => (setSelectedFields ? setSelectedFields({ ...effectiveSelected, titleField: e.target.value }) : setLocalSelected({ ...effectiveSelected, titleField: e.target.value }))}>
              {(headers || []).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className={`chart-container template-${selectedTemplate}`} id="orgChart" ref={chartContainerRef}></div>
          {/* print-only department label (rendered only in print via CSS) */}
          <div className="print-department">{localDepartment ? `Department name: ${localDepartment}` : ''}</div>
        </div>
      </div>
    </>
  );
}
export default OrgChartView;