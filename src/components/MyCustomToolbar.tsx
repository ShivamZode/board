import React, { useState } from 'react';

interface MyCustomToolbarProps {
  excalidrawAPI: any;
  onToolSelect: (tool: string) => void; 
  theme: 'light' | 'dark'; 
}

export default function MyCustomToolbar({ excalidrawAPI, onToolSelect, theme }: MyCustomToolbarProps) {
  const appState = excalidrawAPI?.getAppState() || {};
  const [activeColor, setActiveColor] = useState(appState.currentItemStrokeColor || '#000000'); 
  const [activeTool, setActiveTool] = useState(appState.activeTool?.type || 'freedraw');  
  const [activeStyle, setActiveStyle] = useState(appState.currentItemStrokeStyle || 'solid');   
  const [strokeWidth, setStrokeWidth] = useState(appState.currentItemStrokeWidth || 2);
  const [opacity, setOpacity] = useState(appState.currentItemOpacity ?? 100);

  const handlePointerDown = (e: React.PointerEvent) => e.stopPropagation();

  const changeColor = (color: string) => {
    setActiveColor(color);
    excalidrawAPI?.updateScene({ appState: { currentItemStrokeColor: color } });
  };

  const changeTool = (tool: string) => {
    setActiveTool(tool);
    onToolSelect(tool); 
    const isLocked = tool !== 'selection'; 
    excalidrawAPI?.updateScene({ 
      appState: { activeTool: { type: tool, customType: null, locked: isLocked } } 
    });
  };

  const changeStyle = (style: string) => {
    setActiveStyle(style);
    excalidrawAPI?.updateScene({ appState: { currentItemStrokeStyle: style } });
  };

  const presetColors = ['#000000', '#ffffff', '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#1e293b'];

  const getDisplayColor = (color: string) => {
    if (theme === 'dark') {
      if (color === '#000000') return '#ffffff'; 
      if (color === '#ffffff') return '#232329'; 
      if (color === '#1e293b') return '#94a3b8'; 
    }
    return color;
  };

  const basicTools = [
    { id: 'selection', icon: '🖱️' }, { id: 'freedraw', icon: '✏️' },
    { id: 'eraser', icon: '🧽' }, { id: 'laser', icon: '🔴' }, { id: 'text', icon: '𝐓' }
  ];

  const shapeTools = [
    { id: 'arrow', icon: '↗️' }, { id: 'line', icon: '╱' },
    { id: 'rectangle', icon: '▭' }, { id: 'ellipse', icon: '◯' }, { id: 'diamond', icon: '◇' },
    { id: 'frame', icon: '🔲' } 
  ];

  return (
    // 👇 NEW: We pass the theme as a class so CSS can handle the blurry backgrounds!
    <div className={`custom-toolbar ${theme === 'dark' ? 'dark' : 'light'}`} onPointerDown={handlePointerDown}>
      
      <div className="toolbar-row">
        <input type="color" className="color-picker-input" value={activeColor} onChange={(e) => changeColor(e.target.value)} title="Custom Color" />
        {presetColors.map((color) => (
          <div 
            key={color} 
            className={`color-swatch ${activeColor === color ? 'active' : ''}`} 
            style={{ 
              backgroundColor: getDisplayColor(color), 
              border: activeColor === color ? 'none' : (theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)')
            }} 
            onClick={() => changeColor(color)} 
          />
        ))}
      </div>

      <div className="toolbar-row">
        {basicTools.map((tool) => (
          <button key={tool.id} className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`} onClick={() => changeTool(tool.id)} title={tool.id}>
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="toolbar-row">
        {shapeTools.map((tool) => (
          <button key={tool.id} className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`} onClick={() => changeTool(tool.id)} title={tool.id}>
            {tool.icon}
          </button>
        ))}
      </div>

      <div className="toolbar-row">
        <button className={`option-btn ${activeStyle === 'solid' ? 'active' : ''}`} onClick={() => changeStyle('solid')}>━</button>
        <button className={`option-btn ${activeStyle === 'dashed' ? 'active' : ''}`} onClick={() => changeStyle('dashed')}>┅</button>
        <button className={`option-btn ${activeStyle === 'dotted' ? 'active' : ''}`} onClick={() => changeStyle('dotted')}>┉</button>
      </div>

      <div className="slider-container">
        <label>Size</label>
        <input type="range" min="1" max="10" step="1" value={strokeWidth} onChange={(e) => {
          setStrokeWidth(Number(e.target.value));
          excalidrawAPI?.updateScene({ appState: { currentItemStrokeWidth: Number(e.target.value) } });
        }} />
      </div>

      <div className="slider-container">
        <label>Opacity</label>
        <input type="range" min="10" max="100" step="10" value={opacity} onChange={(e) => {
          setOpacity(Number(e.target.value));
          excalidrawAPI?.updateScene({ appState: { currentItemOpacity: Number(e.target.value) } });
        }} />
      </div>

    </div>
  );
}
