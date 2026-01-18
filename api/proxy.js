import axios from 'axios';

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { targetUrl, token, method = 'GET', data } = req.body;

    if (!targetUrl || !token) {
        return res.status(400).json({ error: 'Target URL and Token are required' });
    }

    try {
        console.log(`🔌 Proxying request to Perfex: ${method} ${targetUrl}`);
        const response = await axios({
            method,
            url: targetUrl,
            headers: {
                'authtoken': token,
                'Content-Type': 'application/json'
            },
            data,
        });

        res.json(response.data);
    } catch (error) {
        console.error('❌ Perfex Proxy Error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: 'Failed to connect to Perfex CRM' });
    }
}
