// Netlify serverless function for home-content proxy
exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const response = await fetch('https://oakwoodsys.com/wp-content/uploads/2025/12/home-content.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching external content:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch external content' })
    };
  }
};
