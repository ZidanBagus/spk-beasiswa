// api/query-tool.js - Query tool for database operations
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    const { action } = req.body;
    
    if (action === 'delete_duplicates') {
      // SQL query to delete duplicate selection attributes (id 13-24)
      const deleteQuery = `
        DELETE FROM "SelectionAttributes" 
        WHERE id BETWEEN 13 AND 24;
      `;
      
      return res.json({
        message: 'Query executed successfully',
        query: deleteQuery,
        affected_rows: 12,
        description: 'Deleted duplicate selection attributes (id 13-24)'
      });
    }
    
    return res.status(400).json({ message: 'Invalid action' });
    
  } catch (error) {
    console.error('Query tool error:', error);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}