// Note: We expect ENGINE_PORT to be globally available or passed in. 
// For now, we retrieval it from sessionStorage where the app stores it.

const getEngineUrl = () => {
  const port = localStorage.getItem('engine_port');
  return `http://127.0.0.1:${port}`;
};

export const downloadCSV = async (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(item => {
    return Object.values(item).map(val => {
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  
  try {
    const res = await fetch(`${getEngineUrl()}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: csvContent, filename }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`Saved to Downloads/${filename}`);
  } catch (err) {
    console.error('Export failed:', err);
    alert(`Export failed: ${err}`);
  }
};

export const downloadJSON = async (data: any, filename: string) => {
  try {
    const res = await fetch(`${getEngineUrl()}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: JSON.stringify(data, null, 2), filename }),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`Saved to Downloads/${filename}`);
  } catch (err) {
    console.error('Export failed:', err);
    alert(`Export failed: ${err}`);
  }
};
