export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({
      success: true,
      data: {
        status: "ready",
        version: "0.1.0-free",
        training_samples: 5,
        learned_categories: 5,
        message: "Boogasi AI is ready!"
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}