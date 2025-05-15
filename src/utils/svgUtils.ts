
// SVG Utility functions

// Generate a smooth waveform with customizable parameters
export const generateWaveform = (width: number, height: number, frequency: number = 1, amplitude: number = 1) => {
  const points = [];
  const segments = 20;
  
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const y = height / 2 + Math.sin(i / segments * Math.PI * 2 * frequency) * amplitude * (height / 3);
    points.push(`${x},${y}`);
  }
  
  return `M${points.join(' L')}`;
};

// Generate bar chart data with random or specified values
export const generateBarChartData = (count: number = 3, maxHeight: number = 100, values?: number[]) => {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const height = values ? values[i] : Math.random() * maxHeight;
    data.push(height);
  }
  
  return data;
};

// Generate pie chart segments
export const generatePieChartSegments = (percentages: number[]) => {
  let segments = [];
  let startAngle = 0;
  
  percentages.forEach(percentage => {
    const angle = percentage * 360 / 100;
    const endAngle = startAngle + angle;
    
    // Convert angles to radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculate points
    const x1 = 50 + 45 * Math.cos(startRad);
    const y1 = 50 + 45 * Math.sin(startRad);
    const x2 = 50 + 45 * Math.cos(endRad);
    const y2 = 50 + 45 * Math.sin(endRad);
    
    // Determine if it's a large arc (more than 180 degrees)
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    segments.push({
      path: `M50,50 L${x1},${y1} A45,45 0 ${largeArcFlag},1 ${x2},${y2} Z`,
      startAngle,
      endAngle
    });
    
    startAngle = endAngle;
  });
  
  return segments;
};
